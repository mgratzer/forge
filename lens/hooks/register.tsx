import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import * as demo from './demo'
import * as model from './model'
import * as parse from './parse'
import { ConfigView, Lens, MAP, WavesView } from './views'

const state = atom({ plugin: 'forge', key: 'model' } as const, model.EMPTY)
const nudged = atom({ plugin: 'forge', key: 'nudged' } as const, [])

const { lens: LENS, config: CONFIG, waves: WAVES } = model.PANES
const PR_FIELDS = 'number,url,title,headRefName,headRefOid,state,mergeable,reviewDecision,statusCheckRollup,body'
const TICK_MS = 1000
const PR_REFRESH_MS = 60_000

export const register: Register = on => {
  // The last next step proposed, so each is proposed once
  let suggested = ''
  // `/forge-x` fires prompt.submit, which starts the run with its args, then skill.prompt
  let submitted: string | null = null

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'forge',
      description: 'forge lens: where the run is and what to run next',
      argumentHint: '[status|map|pane|config|waves|demo [stuck|batch]|reset]',
    })
    await update($, state, m => ({ ...m, demo: null, want: { ...m.want, isConfig: true } }))

    // The effect loop: hooks change the model, this does what it asks for
    let isBusy = false
    let shown: string | undefined
    $.clock.every(TICK_MS, () => {
      if (isBusy) return
      isBusy = true
      void (async () => {
        const now = await $.clock.now()
        let m = await read($, state)
        if (m.demo && now >= m.demo.nextAt) {
          await update($, state, x => demo.tick(x, now))
          m = await read($, state)
        }

        // Clear only what this tick consumed: hooks may queue more while it awaits
        const { panes, alerts } = m
        if (panes.length || alerts.length) {
          await update($, state, x => ({ ...x, panes: x.panes.slice(panes.length), alerts: x.alerts.slice(alerts.length) }))
        }
        for (const id of panes) void $.ui.open({ id, title: model.paneTitle(id) })
        for (const text of alerts) {
          const sent = await $.ui.notify(text, { title: 'forge' }).catch(() => ({ isSent: false }))
          if (!sent.isSent) $.ui.toast(text, { timeoutMs: 8000 })
        }

        const isStale = m.run && !m.run.terminal && !m.run.isDemo && m.pr && now - m.pr.fetchedAt > PR_REFRESH_MS
        if (m.want.pr !== null || m.want.isBranchPr || isStale) {
          const asked = m.want
          const target = asked.pr ?? m.pr?.number
          // A request made while this fetch runs stays for the next tick
          await update($, state, x =>
            x.want.pr === asked.pr && x.want.isBranchPr === asked.isBranchPr ? { ...x, want: { ...x.want, pr: null, isBranchPr: false } } : x,
          )
          const argv = ['gh', 'pr', 'view', ...(target ? [String(target)] : []), '--json', PR_FIELDS]
          const ran = await $.process.run(argv, { cwd: await $.session.cwd(), timeoutMs: 20_000 }).catch(() => null)
          const data = model.ghPr(ran)
          if (data) {
            await update($, state, x => model.withPr(x, data, now))
          } else if (m.pr && !m.pr.isDemo) {
            await update($, state, x => (x.pr ? { ...x, pr: { ...x.pr, fetchedAt: now } } : x))
          }
        }

        if (m.want.isConfig) {
          const repo = await $.session.repo()
          const root = repo?.root ?? (await $.session.cwd())
          const hasAgents = await $.fs.exists(`${root}/AGENTS.md`)
          const agents = hasAgents ? String(await $.fs.read(`${root}/AGENTS.md`, { as: 'text' })) : ''
          const tracker = (await $.fs.exists(`${root}/plan/INDEX.md`)) ? 'plan/ folder (markdown)' : 'GitHub Issues (gh)'
          const env = [
            { name: 'FORGE_STATUS_CMD', value: (await $.env.get('FORGE_STATUS_CMD')) ?? '' },
            { name: 'FORGE_LAUNCHER', value: (await $.env.get('FORGE_LAUNCHER')) ?? '' },
          ]
          const config = { root, hasAgents, ...parse.unattended(agents), tracker, env }
          await update($, state, x => model.withConfig(x, config))

          const text = model.nudgeText(config)
          if (repo && text && !(await read($, nudged)).includes(root)) {
            await update($, nudged, list => [...list, root])
            $.ui.toast(text, { timeoutMs: 8000 })
          }
        }

        m = await read($, state)
        const status = model.statusText(m)
        if (status !== shown) {
          shown = status
          $.ui.status(status)
        }
      })()
        .catch(() => undefined)
        .finally(() => {
          isBusy = false
        })
    })
    return next(e)
  })

  on('command.run', { command: 'forge' }, async ($, e) => {
    const [sub = 'status', variant = ''] = e.args.trim().split(/\s+/).filter(Boolean)
    const now = await $.clock.now()
    switch (sub) {
      case 'map':
        return { text: MAP }
      case 'pane': {
        const isOpen = (await $.ui.panes()).some(p => p.id === LENS.id)
        await update($, state, m => ({ ...m, isLensClosed: isOpen }))
        if (isOpen) await $.ui.close({ id: LENS.id })
        else await $.ui.open(LENS)
        return { text: isOpen ? 'forge pane closed.' : 'forge pane opened.' }
      }
      case 'config':
        await update($, state, m => ({ ...m, want: { ...m.want, isConfig: true } }))
        await $.ui.open(CONFIG)
        return { text: 'forge config opened: the Unattended Shipping settings this repo resolves to.' }
      case 'waves':
        await $.ui.open(WAVES)
        return { text: 'forge waves opened.' }
      case 'demo':
        await update($, state, m => demo.start(m, variant, now))
        return { text: `forge demo${variant ? ` (${variant})` : ''} playing: a replay, nothing touches GitHub.` }
      case 'reset':
        await update($, state, m => model.fresh(m))
        return { text: 'forge lens cleared.' }
      default: {
        await update($, state, m => model.askPr({ ...m, isLensClosed: false, want: { ...m.want, isConfig: true } }))
        void $.ui.open(LENS)
        return { text: model.whereAmI(await read($, state)) }
      }
    }
  })

  // A pane the person closed stays closed until they open it again
  on('ui.close', async ($, e, next) => {
    if (e.id === LENS.id && e.origin.kind === 'person') await update($, state, m => ({ ...m, isLensClosed: true }))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    const cmd = parse.forgeCommand(e.text)
    if (cmd) {
      const now = await $.clock.now()
      suggested = ''
      submitted = cmd.skill
      await update($, state, m => model.startRun(m, cmd.skill, cmd.args, now))
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('skill.prompt', async ($, e, next) => {
    const skill = parse.skillName(e.skill)
    if (skill && skill === submitted) submitted = null
    else if (skill) {
      const now = await $.clock.now()
      await update($, state, m => model.startRun(m, skill, '', now))
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined) return ran
    // A failed command's terminal state didn't happen; a stage start counts either way,
    // since skills prepend it to the stage's own command (`… waiting "CI"; gh pr checks`)
    const lines = parse.statusCalls(e.command).filter(l => !ran.isError || !parse.TERMINAL.includes(l.state))
    const isPrCreate = /(?:^|[;&|(]\s*)gh pr create\b/.test(e.command)
    const url = isPrCreate ? parse.prUrl(parse.resultText(ran.result), parse.repoSlug((await $.session.repo())?.remote ?? null)) : null
    const isPrCommand = /\bgh pr (create|checks|ready|edit|merge)\b/.test(e.command)
    if (lines.length || url || isPrCommand) {
      const now = await $.clock.now()
      await update($, state, m => {
        let x = lines.reduce((acc, l) => model.applyStatus(acc, l.state, l.detail, now), m)
        if (!x.run) return x
        if (url && x.pr?.number !== url.number) return model.askPr(x, url.number)
        return isPrCommand ? model.askPr(x) : x
      })
    }
    return ran
  }).catch(($, e, next) => next(e))

  // forge-ship reads the composed skills' files: guard, land, …
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const step = /forge-([\w-]+)\/SKILL\.md$/.exec(e.file_path)?.[1]
    if (step && (parse.PIPELINE as readonly string[]).includes(step)) {
      await update($, state, m => (m.run && m.run.skill !== step ? model.setPhase(m, step) : m))
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // Reviewer sub-agents answer with `### file` / `- [P1] …` findings
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const ran = await next(e)
    const text = ran.deny === undefined ? parse.resultText(ran.result) : ''
    if (text) await update($, state, m => model.withReviewText(m, text))
    return ran
  }).catch(($, e, next) => next(e))

  // A background reviewer's report arrives as a delivery
  on('session.receive', async ($, e, next) => {
    await update($, state, m => model.withReviewText(m, e.text))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await update($, state, m => {
      const x = model.withAnswer(m, done.text ?? '')
      return x.run && !x.run.isDemo && x.pr ? model.askPr(x) : x
    })
    const step = (await read($, state)).next
    if (step && step.text !== suggested && e.reason === 'answer') {
      suggested = step.text
      void $.prompt.suggest({ text: step.text })
    }
    return done
  }).catch(($, e, next) => next(e))

  // Our next step beats the engine's generic guess while a run is open
  on('prompt.suggest', async ($, e, next) => {
    const step = (await read($, state)).next
    return e.origin.kind === 'suggestion' && step ? next({ ...e, text: step.text }) : next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: LENS.id }, async ($, e) => {
    const m = await read($, state)
    return (
      <Lens
        ui={$.ui.resolve(e)}
        now={await $.clock.now()}
        run={m.run}
        timeline={m.timeline}
        visited={m.visited}
        pr={m.pr}
        findings={m.findings}
        risk={m.risk}
        result={m.result}
        next={m.next}
        onToggle={id => void update($, state, x => model.toggleFinding(x, id))}
        onRefresh={() => void update($, state, x => model.askPr(x))}
      />
    )
  })

  on('ui.render', { component: 'Pane', requestId: CONFIG.id }, async ($, e) => (
    <ConfigView ui={$.ui.resolve(e)} config={(await read($, state)).config} />
  ))

  on('ui.render', { component: 'Pane', requestId: WAVES.id }, async ($, e) => (
    <WavesView ui={$.ui.resolve(e)} batch={(await read($, state)).batch} />
  ))

  // The next step, one line above the prompt
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const m = await read($, state)
    if (e.props.hasSurvey || !m.next || m.isBandHidden) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        <Text color="claude">forge ▸ next</Text>
        <Text color="suggestion" bold>
          {m.next.text}
        </Text>
        <Text dimColor wrap="truncate">
          {m.next.why}
        </Text>
        <Button
          key="pane"
          label="Pane"
          plain
          onPress={() => {
            void update($, state, x => ({ ...x, isLensClosed: false }))
            void $.ui.open(LENS)
          }}
        />
        <Button key="hide" label="Hide" plain onPress={() => void update($, state, x => ({ ...x, isBandHidden: true }))} />
      </Box>
    )
  })
}
