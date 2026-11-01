export type Stage = { state: string; detail: string; at: number };

export type Run = {
	skill: string;
	args: string;
	startedAt: number;
	// the composed process forge-ship is in (implement, review, guard, land)
	phase: string;
	round: number;
	maxRounds: number;
	terminal: string | null;
	isDemo: boolean;
};

export type Checks = { pass: number; fail: number; pending: number; failing: string[] };

export type Pr = {
	number: number;
	url: string;
	title: string;
	branch: string;
	headSha: string;
	state: string;
	mergeable: string;
	reviewDecision: string;
	checks: Checks;
	isDemo: boolean;
	fetchedAt: number;
};

export type Finding = {
	id: string;
	severity: string;
	file: string;
	text: string;
	isDone: boolean;
};

export type Risk = {
	verdict: string;
	sha: string;
	bullets: string[];
	lookAt: string[];
	revert: string;
};

export type WaveRow = { num: string; title: string; touch: string; notes: string };
export type Wave = { title: string; rows: WaveRow[]; launch: string };
// One Issue in a `--start` run's ### Status table: merged, in flight, ready, waiting
export type StatusRow = { num: string; title: string; state: string; detail: string };
// One PR of a test-merge, in merge order: clean, or what it conflicts with
export type OrderRow = { step: string; pr: string; result: string };
export type MergeOrder = { rows: OrderRow[]; gates: string };
export type BatchStatus = { rows: StatusRow[]; launch: string; merge: string; progress: string };
// status is null for a plan, which starts nothing
// order is null until a --start run test-merges its judged PRs
export type Batch = {
	scope: string;
	status: BatchStatus | null;
	order: MergeOrder | null;
	waves: Wave[];
	excluded: string[];
};

export type Next = { text: string; why: string };

export type Setting = { name: string; value: string; fallback: string; usedBy: string; isSet: boolean };

export type Config = {
	root: string;
	hasAgents: boolean;
	hasSection: boolean;
	hasStaleHeading: boolean;
	tracker: string;
	settings: Setting[];
	env: { name: string; value: string }[];
};

export type Demo = { variant: string; step: number; nextAt: number };

// Work the effect loop does outside any hook: hooks only change the model
export type Want = { pr: number | null; isBranchPr: boolean; isConfig: boolean };

export type Model = {
	run: Run | null;
	timeline: Stage[];
	visited: string[];
	pr: Pr | null;
	findings: Finding[];
	risk: Risk | null;
	result: string;
	batch: Batch | null;
	next: Next | null;
	isBandHidden: boolean;
	// the person closed the pane: a new run doesn't open it again
	isLensClosed: boolean;
	config: Config | null;
	want: Want;
	alerts: string[];
	panes: string[];
	demo: Demo | null;
};

declare module "claude-code" {
	interface PluginState {
		forge: {
			model: Model;
			nudged: string[];
		};
	}
}
