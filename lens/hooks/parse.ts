// Pure readers of forge's text contracts: the status line, reviewer findings,
// the ## Risk section, forge-batch's output and the Unattended Shipping config.
import type { Batch, Checks, Finding, Next, Pr, Risk, Run, Setting, Wave } from "../types";

export const PIPELINE = [
	"setup-project",
	"shape",
	"create-issue",
	"implement",
	"reflect",
	"address-pr-feedback",
	"guard",
	"land",
] as const;

export const DEFAULT_ROUNDS = 3;

// The pipeline step a status puts a run in; the others leave it where it is
const STATE_STEP: Record<string, string> = {
	implementing: "implement",
	waiting: "guard",
	"merge-ready": "land",
	merged: "land",
};

export const stepFor = (state: string, step: string): string => STATE_STEP[state] ?? step;

export const runLabel = (skill: string, args: string): string => `/forge-${skill} ${args}`.trim();

// `forge-ship`, also `forge:forge-ship` from a plugin install → `ship`
export const skillName = (name: string): string | null => /^(?:[\w-]+:)?forge-([\w-]+)$/.exec(name)?.[1] ?? null;

export const TERMINAL = ["pushed", "review-ready", "merge-ready", "merged", "needs-human", "failed"];
const STATES = ["implementing", "reviewing", "waiting", "addressing", ...TERMINAL];

// The status call a skill writes into its Bash command (status-reporting.md):
// `"$FORGE_STATUS_CMD" <state> "<detail>"` and its fallback `echo "[forge] <state>: <detail>"`.
// Read from the command, never from output, which any file or tool can fill.
export function statusCalls(command: string): { state: string; detail: string }[] {
	const echoed = [...command.matchAll(/echo "\[forge\] ([a-z-]+): ?([^"\n]*)"/g)];
	const called = [...command.matchAll(/"\$\{?FORGE_STATUS_CMD\}?" ([a-z-]+) "([^"\n]*)"/g)];
	return (echoed.length ? echoed : called)
		.map((m) => ({ state: m[1] ?? "", detail: (m[2] ?? "").trim() }))
		.filter((c) => STATES.includes(c.state));
}

// `/forge-ship --guard 42`, also `/forge:forge-ship …` from a plugin install
export function forgeCommand(text: string): { skill: string; args: string } | null {
	const m = /^\/(\S+)\s*([\s\S]*)$/.exec(text.trim());
	const skill = m ? skillName(m[1] ?? "") : null;
	return m && skill ? { skill, args: (m[2] ?? "").trim() } : null;
}

// A pull request link into `slug` (owner/repo) only: output may name any repository
// The last link wins: `gh pr create` prints the new PR's URL last
export function prUrl(text: string, slug: string): { number: number; url: string } | null {
	let found: { number: number; url: string } | null = null;
	for (const m of text.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g)) {
		if (slug && (m[1] ?? "").toLowerCase() === slug) found = { number: Number(m[2]), url: m[0] };
	}
	return found;
}

// A low risk verdict, judged by its first word: "not low" or "below" don't count
export const isLowRisk = (verdict: string): boolean => /^\W*low\b/i.test(verdict);

// owner/repo from a GitHub remote (https or ssh), lowercased; '' for any other host
export function repoSlug(remote: string | null): string {
	const m = /github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(remote ?? "");
	return (m?.[1] ?? "").toLowerCase();
}

// A verdict counts only for the commit it was judged on (forge-land's rule)
export const isOnHead = (risk: Risk | null, pr: Pr | null): boolean =>
	!!risk && !!pr && risk.sha !== "" && pr.headSha.startsWith(risk.sha);

// The first bare number in a skill's arguments: an Issue or PR number
export function argNumber(args: string): number | null {
	// --max-rounds is the one forge flag that takes a value
	const bare = (args.split(" -- ")[0] ?? "").replace(/--max-rounds[ =]\S+/g, " ");
	const m = /(?:^|\s)#?(\d+)(?:\s|$)/.exec(bare);
	return m ? Number(m[1]) : null;
}

export function round(detail: string): { round: number; max: number } | null {
	const m = /round (\d+)(?:\s*(?:\/|of)\s*(\d+))?/i.exec(detail);
	return m ? { round: Number(m[1]), max: Number(m[2] ?? 0) } : null;
}

// The steps worth a row: setup-project only until the repo is set up, or while it runs
export const pipelineFor = (step: string | null, isSetUp: boolean | null): string[] =>
	PIPELINE.filter((s) => s !== "setup-project" || s === step || isSetUp === false);

// Which pipeline step a run is in
export const currentStep = (run: Run | null): string | null => run?.phase ?? null;

// Reviewer output: `### <file>` headers over `- [P0] <finding>` lines
export function findings(text: string): Finding[] {
	const out: Finding[] = [];
	let file = "";
	for (const line of text.split("\n")) {
		const header = /^#{2,4} (.+)$/.exec(line.trim());
		if (header) file = (header[1] ?? "").replace(/`/g, "");
		const m = /^\s*[-*] \[(P[0-2])\] (.+)$/.exec(line);
		if (m) {
			const body = (m[2] ?? "").trim();
			// the same finding arrives from the reviewer, a report and the restating answer
			out.push({ id: `${m[1]}:${file}:${body.slice(0, 80)}`, severity: m[1] ?? "P2", file, text: body, isDone: false });
		}
	}
	return out;
}

export function riskSection(text: string): Risk | null {
	const start = text.search(/^## Risk\s*$/m);
	if (start < 0) return null;
	const rest = text.slice(start).split("\n").slice(1);
	const end = rest.findIndex((l) => /^## /.test(l));
	const body = (end < 0 ? rest : rest.slice(0, end)).join("\n");
	const verdict = /\*\*Verdict:\*\*\s*(.+?)(?:,\s*judged on\s*`?([0-9a-f]{7,40})`?)?\s*$/m.exec(body);
	if (!verdict) return null;
	const look = body.split(/\*\*Where to look\*\*.*\n/)[1] ?? "";
	return {
		verdict: (verdict[1] ?? "").trim(),
		sha: (verdict[2] ?? "").slice(0, 10),
		bullets: [...(body.split(/\*\*Where to look\*\*/)[0] ?? "").matchAll(/^- (.+)$/gm)].map((m) => m[1] ?? ""),
		lookAt: [...(look.split(/\*\*Revert/)[0] ?? "").matchAll(/^- (.+)$/gm)].map((m) => m[1] ?? ""),
		revert: (/\*\*Revert:\*\*\s*(.+)$/m.exec(body)?.[1] ?? "").trim(),
	};
}

// forge-land and forge-ship end with `**Result:** <state> …`
export function resultLine(text: string): string {
	return (/\*\*Result:\*\*\s*(.+)$/m.exec(text)?.[1] ?? "").trim();
}

export function batch(text: string): Batch | null {
	const head = /^## Batch: (.+)$/m.exec(text);
	if (!head) return null;
	const waves: Wave[] = [];
	let excluded: string[] = [];
	for (const chunk of text.slice(head.index).split(/^### /m).slice(1)) {
		const [title = "", ...lines] = chunk.split("\n");
		if (/^Excluded/.test(title)) {
			excluded = lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
			continue;
		}
		const rows = lines
			.filter((l) => /^\|\s*#?\d+/.test(l))
			.map((l) =>
				l
					.split("|")
					.slice(1, -1)
					.map((c) => c.trim()),
			)
			.map(([num = "", t = "", touch = "", notes = ""]) => ({ num, title: t, touch, notes }));
		const launch = (/^launch: (.+)$/m.exec(lines.join("\n"))?.[1] ?? "").trim();
		waves.push({ title: title.trim(), rows, launch });
	}
	return { scope: (head[1] ?? "").trim(), waves, excluded };
}

type Rollup = {
	conclusion?: string | null;
	status?: string | null;
	state?: string | null;
	name?: string;
	context?: string;
};

export function checks(rollup: Rollup[]): Checks {
	const out: Checks = { pass: 0, fail: 0, pending: 0, failing: [] };
	for (const c of rollup) {
		const verdict = (c.conclusion ?? c.state ?? "").toUpperCase();
		if (c.status && c.status !== "COMPLETED") out.pending += 1;
		else if (["SUCCESS", "NEUTRAL", "SKIPPED"].includes(verdict)) out.pass += 1;
		else if (verdict === "PENDING" || verdict === "EXPECTED" || verdict === "") out.pending += 1;
		else {
			out.fail += 1;
			out.failing.push(c.name ?? c.context ?? "?");
		}
	}
	return out;
}

const SETTINGS: Omit<Setting, "value" | "isSet">[] = [
	{ name: "Peer reviewer", fallback: "none", usedBy: "guard" },
	{ name: "Security-sensitive paths", fallback: "forge's risky-signal heuristics", usedBy: "guard, land" },
	{ name: "Serialized resources", fallback: "migrations, lockfiles, generated files", usedBy: "batch" },
	{ name: "Max guard rounds", fallback: String(DEFAULT_ROUNDS), usedBy: "guard" },
	{ name: "Auto-merge", fallback: "off", usedBy: "land" },
];

export function unattended(agents: string): { hasSection: boolean; hasStaleHeading: boolean; settings: Setting[] } {
	const at = agents.search(/^## Unattended Shipping\s*$/m);
	const section = at < 0 ? "" : (agents.slice(at).split(/\n## /)[0] ?? "");
	const settings = SETTINGS.map((s) => {
		const value = new RegExp(`^- ${s.name}:\\s*(.+)$`, "mi").exec(section)?.[1]?.trim() ?? "";
		return { ...s, value, isSet: value !== "" };
	});
	return { hasSection: at >= 0, hasStaleHeading: /^## Shipping\s*$/m.test(agents), settings };
}

// The step a person most likely wants after what just happened
export function nextStep(run: Run | null, pr: Pr | null, openFindings: number, risk: Risk | null): Next | null {
	if (!run) return null;
	const n = pr ? String(pr.number) : "";
	const issue = argNumber(run.args);
	switch (run.terminal) {
		case "needs-human":
			return { text: `/forge-address-pr-feedback ${n}`.trim(), why: "the guard stopped and needs a decision from you" };
		case "review-ready":
			return { text: `/forge-land ${n}`.trim(), why: "green and addressed: land judges the risk" };
		case "merge-ready":
			return pr && isOnHead(risk, pr) && isLowRisk(risk?.verdict ?? "")
				? {
						text: `! gh pr merge ${n} --squash --match-head-commit ${pr.headSha}`,
						why: `land judged ${pr.headSha.slice(0, 7)} low risk; the merge holds only for that commit`,
					}
				: { text: `/forge-land ${n}`.trim(), why: "no low risk verdict on the head commit: land judges it again" };
		case "pushed":
			return { text: `/forge-guard ${n}`.trim(), why: "the PR is open: guard drives it to review-ready" };
		case "merged":
			return { text: "/forge-reflect", why: "merged: capture what the session taught" };
		case "failed":
			return { text: runLabel(run.skill, run.args), why: "the run failed: retry once the cause is fixed" };
	}
	switch (run.skill) {
		case "setup-project":
			return { text: "/forge-shape ", why: "project set up: shape the first idea" };
		case "shape":
			return { text: "/forge-create-issue ", why: "shaped: turn it into an Issue" };
		case "create-issue":
			return { text: `/forge-ship ${issue ?? ""}`.trim(), why: "Issue ready: ship implements and reviews it" };
		case "implement":
			return pr ? { text: `/forge-guard ${n}`, why: "PR open: guard reviews and drives it" } : null;
		case "address-pr-feedback":
			return openFindings > 0
				? null
				: { text: `/forge-guard ${n}`.trim(), why: "feedback addressed: guard checks CI and threads again" };
		case "batch":
			return { text: "/forge-ship --guard ", why: "start each Issue of Wave 1 in its own session" };
	}
	return null;
}

// The text in a tool's result, whatever its shape: Bash's stdout and stderr
// (kept when the command exits non-zero), an Agent's content blocks, a string
export function resultText(result: unknown): string {
	if (typeof result === "string") return result;
	if (!result || typeof result !== "object") return "";
	const r = result as { stdout?: unknown; stderr?: unknown; content?: unknown };
	const parts = [r.stdout, r.stderr].filter((x): x is string => typeof x === "string");
	if (Array.isArray(r.content)) {
		for (const c of r.content) if (c && typeof c === "object" && typeof c.text === "string") parts.push(c.text);
	}
	return parts.join("\n");
}
