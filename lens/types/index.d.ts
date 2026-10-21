export type Stage = { state: string; detail: string; at: number }

export type Run = {
  skill: string
  args: string
  startedAt: number
  // the composed process forge-ship is in (implement, review, guard, land)
  phase: string
  round: number
  maxRounds: number
  terminal: string | null
  isDemo: boolean
}

export type Checks = { pass: number; fail: number; pending: number; failing: string[] }

export type Pr = {
  number: number
  url: string
  title: string
  branch: string
  headSha: string
  state: string
  mergeable: string
  reviewDecision: string
  checks: Checks
  isDemo: boolean
  fetchedAt: number
}

export type Finding = {
  id: string
  severity: string
  file: string
  text: string
  isDone: boolean
}

export type Risk = {
  verdict: string
  sha: string
  bullets: string[]
  lookAt: string[]
  revert: string
}

export type WaveRow = { num: string; title: string; touch: string; notes: string }
export type Wave = { title: string; rows: WaveRow[]; launch: string }
export type Batch = { scope: string; waves: Wave[]; excluded: string[] }

export type Next = { text: string; why: string }

export type Setting = { name: string; value: string; fallback: string; usedBy: string; isSet: boolean }

export type Config = {
  root: string
  hasAgents: boolean
  hasSection: boolean
  hasStaleHeading: boolean
  tracker: string
  settings: Setting[]
  env: { name: string; value: string }[]
  readAt: number
}

export type Demo = { variant: string; step: number; nextAt: number }

// Work the effect loop does outside any hook: hooks only change the model
export type Want = { pr: number | null; isBranchPr: boolean; isConfig: boolean }

export type Model = {
  run: Run | null
  timeline: Stage[]
  visited: string[]
  pr: Pr | null
  findings: Finding[]
  risk: Risk | null
  result: string
  batch: Batch | null
  next: Next | null
  isBandHidden: boolean
  // the person closed the pane: a new run doesn't open it again
  isLensClosed: boolean
  config: Config | null
  want: Want
  alerts: string[]
  panes: string[]
  demo: Demo | null
}

declare module 'claude-code' {
  interface PluginState {
    'forge': {
      model: Model
      nudged: string[]
    }
  }
}
