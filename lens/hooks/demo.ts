// A scripted forge-ship --guard run fed through the same transitions real
// events take, so every view can be tried without spending a real run.
import type { Model } from "../types";
import * as model from "./model";
import * as parse from "./parse";

const STEP_MS = 2500;

const REVIEW = `### src/routes/notes.js
- [P1] Line 42: the rate limiter keys on req.ip, which is the proxy's address behind the load balancer
- [P2] Line 58: the 429 response omits Retry-After
### src/limiter.js
- [P1] Line 12: the bucket map grows without bound; entries are never evicted`;

const RISK_LOW = `## Risk

**Verdict:** low risk, judged on 3f9c2a1e8b7d6c5a4f3e2d1c0b9a8f7e6d5c4b3a

- Size: 118 counted lines (64 excluded: tests) → ok
- Always-review paths: none
- Tests: ok
- Exercise: ok
- Trust: ok
- What the checks would miss: limits under real proxy headers are only covered by a unit test.`;

const RISK_REVIEW = `## Risk

**Verdict:** needs review, judged on 3f9c2a1e8b7d6c5a4f3e2d1c0b9a8f7e6d5c4b3a

- Size: 412 counted lines (90 excluded: tests) → over 400
- Always-review paths: src/auth.js
- Tests: ok
- Exercise: ok
- Trust: ok
- What the checks would miss: the session cookie change affects every logged-in client.

**Where to look** (needs review only)
- \`src/auth.js:31\`: does the new SameSite value break the OAuth callback?
- \`src/limiter.js:12\`: is eviction safe while a request holds the bucket?`;

const BATCH = `## Batch: milestone v0.4 (demo)

### Wave 1 (3 Issues)
| # | Title | Touch set | Notes |
|---|-------|-----------|-------|
| 42 | feat(api): rate-limit the notes API | src/limiter.js, src/routes/notes.js | |
| 43 | fix(ui): keep the draft on reload | web/editor.js | adjacent to #45 |
| 44 | docs: document the export format | docs/export.md | |

launch: forge-launch 42 43 44

### Wave 2 (2 Issues, after Wave 1 merges)
| # | Title | Touch set | Notes |
|---|-------|-----------|-------|
| 45 | feat(ui): tag filter in the sidebar | web/sidebar.js, web/editor.js | |
| 46 | chore(db): add the tags index | db/migrations/0007_tags.sql | serialized: migrations |

launch: forge-launch 45 46

### Excluded
- #47: HITL (needs a pricing decision)
- #48: open PR #91 already`;

type Step = (m: Model, now: number) => Model;

export function start(m: Model, variant: string, now: number): Model {
	if (variant === "batch") {
		const run = model.startRun(model.fresh(m), "batch", "milestone v0.4", now, true);
		const out = model.applyStatus(run, "reviewing", "touch sets for 7 Issues", now);
		return { ...out, batch: parse.batch(BATCH), panes: [...out.panes, model.PANES.waves.id] };
	}
	const run = model.startRun(model.fresh(m), "ship", "--guard 42", now, true);
	return { ...run, demo: { variant, step: 0, nextAt: now + 1000 } };
}

// The demo's next step, once its time has come
export function tick(m: Model, now: number): Model {
	if (!m.demo || now < m.demo.nextAt) return m;
	const steps = script(m.demo.variant === "stuck");
	const step = steps[m.demo.step];
	if (!step) return { ...m, demo: null };
	return { ...step(m, now), demo: { ...m.demo, step: m.demo.step + 1, nextAt: now + STEP_MS } };
}

const checks =
	(pass: number, fail: number, pending: number, failing: string[] = []): Step =>
	(m) =>
		model.withDemoPr(m, { pass, fail, pending, failing });

function script(isStuck: boolean): Step[] {
	const status =
		(state: string, detail: string): Step =>
		(m, now) =>
			model.applyStatus(m, state, detail, now);
	const then =
		(...steps: Step[]): Step =>
		(m, now) =>
			steps.reduce((acc, s) => s(acc, now), m);
	const steps: Step[] = [
		status("implementing", "Issue #42: rate-limit the notes API"),
		then(checks(0, 0, 5), status("reviewing", "2 reviewer passes on 6 files")),
		(m) => model.addFindings(m, parse.findings(REVIEW)),
		(m) => model.closeFindings(m, 1),
		(m) => model.closeFindings(m, 1),
		then(status("waiting", "CI on PR #88 (5 checks)"), checks(3, 0, 2)),
		then(checks(4, 1, 0, ["deps-audit"]), status("addressing", "round 1/3: deps-audit fails, 1 review thread")),
		then((m) => model.closeFindings(m, 5), status("waiting", "CI rerun and peer review (copilot)"), checks(4, 0, 1)),
		checks(5, 0, 0),
	];
	if (isStuck) {
		steps.push(
			status("addressing", "round 3/3: copilot asks to change the auth cookie"),
			then(
				(m) => ({ ...m, risk: parse.riskSection(RISK_REVIEW) }),
				status("needs-human", "round limit reached: a cookie decision is yours"),
			),
		);
	} else {
		steps.push(
			status("reviewing", "land: fresh-context risk verdict"),
			then(
				(m) => ({ ...m, risk: parse.riskSection(RISK_LOW), result: "merge-ready" }),
				status("merge-ready", "low risk on 3f9c2a1"),
			),
		);
	}
	return steps;
}
