// Pure transitions of the forge lens's one model. Hooks apply them with
// `update($, model, m => …)`; the effect loop in register.tsx does the rest.
import type { Config, Finding, Model, Pr, Run, Stage } from "../types";
import * as parse from "./parse";

export const PANES = {
	lens: { id: "forge-lens", title: "forge" },
	config: { id: "forge-config", title: "forge config" },
	waves: { id: "forge-waves", title: "forge waves" },
} as const;

export const paneTitle = (id: string): string => Object.values(PANES).find((p) => p.id === id)?.title ?? id;

export const EMPTY: Model = {
	run: null,
	timeline: [],
	visited: [],
	pr: null,
	findings: [],
	risk: null,
	result: "",
	batch: null,
	next: null,
	isBandHidden: false,
	isLensClosed: false,
	config: null,
	want: { pr: null, isBranchPr: false, isConfig: false },
	alerts: [],
	panes: [],
	demo: null,
};

const withNext = (m: Model): Model => ({
	...m,
	next: parse.nextStep(m.run, m.pr, m.findings.filter((f) => !f.isDone).length, m.risk),
});

const visit = (m: Model, step: string | null): Model =>
	step && !m.visited.includes(step) ? { ...m, visited: [...m.visited, step] } : m;

// A clean model that keeps what describes the project, not the run
export const fresh = (m: Model): Model => ({ ...EMPTY, config: m.config });

// Ask the effect loop for a PR: the one numbered, else the branch's
export const askPr = (m: Model, n: number | null = m.pr?.number ?? null): Model => ({
	...m,
	want: { ...m.want, pr: n, isBranchPr: n === null },
});

export const lastState = (m: Model): Stage | null => {
	const last = m.timeline.at(-1);
	return last && last.state !== "start" ? last : null;
};

export function startRun(m: Model, skill: string, args: string, now: number, isDemo = false): Model {
	const max = /--max-rounds (\d+)/.exec(args)?.[1];
	const run: Run = {
		skill,
		args,
		startedAt: now,
		phase: skill === "ship" ? "implement" : skill,
		round: 0,
		maxRounds: max ? Number(max) : 0,
		terminal: null,
		isDemo,
	};
	// these work on a PR: the one named, else the branch's; the others start fresh
	const takesPr = ["guard", "land", "address-pr-feedback", "reflect"].includes(skill);
	const started: Model = {
		...m,
		run,
		timeline: [{ state: "start", detail: parse.runLabel(skill, args), at: now }],
		findings: [],
		risk: null,
		result: "",
		next: null,
		isBandHidden: false,
		pr: null,
		demo: null,
		want: { ...m.want, pr: null, isBranchPr: false },
		panes: m.isLensClosed ? m.panes : [...m.panes, PANES.lens.id],
	};
	const asked = takesPr && !isDemo ? askPr(started, parse.argNumber(args)) : started;
	return visit(asked, parse.currentStep(run));
}

export function setPhase(m: Model, phase: string): Model {
	if (!m.run) return m;
	const run = { ...m.run, phase };
	return visit({ ...m, run }, parse.currentStep(run));
}

// One `[forge] <state>: <detail>` transition
export function applyStatus(m: Model, state: string, detail: string, now: number): Model {
	const base = m.run ? m : startRun(m, "run", "", now);
	const prev = base.run;
	if (!prev) return m;
	const r = parse.round(detail);
	const phase = parse.stepFor(state, prev.phase);
	const isTerminal = parse.TERMINAL.includes(state);
	const run: Run = {
		...prev,
		phase,
		round: r ? r.round : state === "addressing" ? Math.max(prev.round, 1) : prev.round,
		maxRounds: r?.max ? r.max : prev.maxRounds,
		terminal: isTerminal ? state : prev.terminal,
	};
	let out: Model = {
		...base,
		run,
		timeline: [...base.timeline, { state, detail, at: now }].slice(-40),
		alerts: isTerminal ? [...base.alerts, `/forge-${run.skill}: ${state}${detail ? `, ${detail}` : ""}`] : base.alerts,
	};
	out = visit(out, parse.currentStep(run));
	if (state === "addressing") out = visit(out, "address-pr-feedback");
	return withNext(out);
}

export function addFindings(m: Model, found: Finding[]): Model {
	if (found.length === 0) return m;
	const known = new Set(m.findings.map((f) => f.id));
	return withNext({ ...m, findings: [...m.findings, ...found.filter((f) => !known.has(f.id))].slice(-60) });
}

// Reviewer findings from a sub-agent's result, a delivered report or an answer
export const withReviewFindings = (m: Model, found: Finding[]): Model =>
	m.run && !m.run.isDemo ? addFindings(m, found) : m;

export function toggleFinding(m: Model, id: string): Model {
	return withNext({ ...m, findings: m.findings.map((f) => (f.id === id ? { ...f, isDone: !f.isDone } : f)) });
}

export function closeFindings(m: Model, count: number): Model {
	let left = count;
	return withNext({
		...m,
		findings: m.findings.map((f) => (!f.isDone && left-- > 0 ? { ...f, isDone: true } : f)),
	});
}

export type GhPr = {
	number: number;
	url: string;
	title: string;
	headRefName: string;
	headRefOid: string;
	state: string;
	mergeable: string;
	reviewDecision: string;
	statusCheckRollup: Parameters<typeof parse.checks>[0] | null;
	body: string | null;
};

// `gh pr view --json` output, or null when the call failed or printed something else
export function ghPr(ran: { exitCode: number; stdout: string } | null): GhPr | null {
	if (ran?.exitCode !== 0) return null;
	try {
		return JSON.parse(ran.stdout) as GhPr;
	} catch {
		return null;
	}
}

export function withPr(m: Model, data: GhPr, now: number): Model {
	const pr: Pr = {
		number: data.number,
		url: data.url,
		title: data.title,
		branch: data.headRefName,
		headSha: data.headRefOid,
		state: data.state,
		mergeable: data.mergeable,
		reviewDecision: data.reviewDecision,
		checks: parse.checks(data.statusCheckRollup ?? []),
		isDemo: false,
		fetchedAt: now,
	};
	return withNext({ ...m, pr, risk: parse.riskSection(data.body ?? "") ?? m.risk });
}

export function withDemoPr(m: Model, checks: Pr["checks"]): Model {
	const pr: Pr = {
		number: 88,
		url: "https://github.com/example/notes/pull/88",
		title: "feat(api): rate-limit the notes API",
		branch: "feat/42-rate-limit",
		headSha: "3f9c2a1e8b7d6c5a4f3e2d1c0b9a8f7e6d5c4b3a",
		state: "OPEN",
		mergeable: "MERGEABLE",
		reviewDecision: "REVIEW_REQUIRED",
		checks,
		isDemo: true,
		fetchedAt: 0,
	};
	return withNext({ ...m, pr });
}

// What a finished turn's answer says: a batch, a ## Risk section, a Result line
export function withAnswer(m: Model, text: string): Model {
	let out = m;
	const found = parse.batch(text);
	if (found) out = { ...out, batch: found, panes: [...out.panes, PANES.waves.id] };
	if (out.run && !out.run.isDemo) {
		out = withReviewFindings(
			{ ...out, risk: parse.riskSection(text) ?? out.risk, result: parse.resultLine(text) || out.result },
			parse.findings(text),
		);
	}
	return withNext(out);
}

// How stale the PR may get: the loop refreshes an open run's PR every minute,
// and a finished turn, which may have pushed, asks again after 15 seconds
export const PR_REFRESH_MS = 60_000;
const TURN_REFRESH_MS = 15_000;

export const isPrStale = (m: Model, now: number, ms: number): boolean =>
	!!m.pr && !m.pr.isDemo && now - m.pr.fetchedAt > ms;

const isLive = (m: Model): boolean => !!m.run && !m.run.isDemo;

// Whether a finished turn can change the model: a live run, or a batch in the answer
export const turnMatters = (m: Model, text: string): boolean => isLive(m) || /^## Batch: /m.test(text);

export function afterTurn(m: Model, text: string, now: number): Model {
	if (!turnMatters(m, text)) return m;
	const out = withAnswer(m, text);
	return isLive(out) && isPrStale(out, now, TURN_REFRESH_MS) ? askPr(out) : out;
}

export function withConfig(m: Model, config: Config): Model {
	return { ...m, config, want: { ...m.want, isConfig: false } };
}

// The one toast a repository gets: forge isn't set up, or reads a stale heading
export function nudgeText(c: Config): string {
	if (!c.hasAgents) return "forge: no AGENTS.md here. /forge-setup-project sets the project up";
	if (c.hasStaleHeading) return 'forge: AGENTS.md says "## Shipping"; forge reads "## Unattended Shipping"';
	return "";
}

export function statusText(m: Model): string | undefined {
	const r = m.run;
	if (!r) return undefined;
	const last = lastState(m);
	const parts = [`forge ▸ ${r.skill}${r.args ? ` ${r.args.split(" -- ")[0]}` : ""}`];
	if (r.skill === "ship") parts.push(r.phase);
	if (last) parts.push(last.state);
	if (r.round > 0) parts.push(`round ${r.round}/${r.maxRounds || parse.DEFAULT_ROUNDS}`);
	if (m.pr) {
		const c = m.pr.checks;
		const total = c.pass + c.fail + c.pending;
		parts.push(`PR #${m.pr.number}${total ? ` CI ${c.pass}/${total}${c.fail ? ` ✗${c.fail}` : ""}` : ""}`);
	}
	return parts.join(" · ");
}

// `/forge` with nothing else: where the run is and what to do
export function whereAmI(m: Model): string {
	const lines: string[] = [];
	const r = m.run;
	if (r) {
		const last = lastState(m);
		const state = last ? `, ${last.state}${last.detail ? ` (${last.detail})` : ""}` : "";
		lines.push(`Run: ${parse.runLabel(r.skill, r.args)}${state}`);
	} else lines.push("No forge run in this session yet.");
	const pr = m.pr;
	if (pr) {
		const c = pr.checks;
		lines.push(
			`PR #${pr.number} ${pr.title}: CI ${c.pass} passed, ${c.fail} failed, ${c.pending} pending; ${pr.reviewDecision || "no review decision"}`,
		);
	}
	if (m.config && !m.config.hasAgents) lines.push("Next: /forge-setup-project (no AGENTS.md yet)");
	else if (m.next) lines.push(`Next: ${m.next.text}  (${m.next.why})`);
	else if (pr && pr.checks.fail > 0) lines.push(`Next: /forge-guard ${pr.number}  (CI fails: guard addresses it)`);
	else if (pr) lines.push(`Next: /forge-guard ${pr.number}, then /forge-land ${pr.number}`);
	else
		lines.push(
			"Next: /forge-shape <idea>, /forge-create-issue <idea>, or /forge-ship <issue>. /forge map shows the whole flow.",
		);
	return lines.join("\n");
}
