import type { On } from "claude-code";
import { expect, mock, test } from "claude-code/testing";

import * as model from "../hooks/model";
import * as parse from "../hooks/parse";

const pane = (requestId: string) =>
	({
		plugin: "forge",
		component: "Pane",
		requestId,
		props: {
			title: "forge",
			isFocused: false,
			bodyColumns: 48,
			placement: "dock",
			scroll: { offset: 0, bodyRows: 60 },
			view: {},
		},
	}) as const;

const forge = (args: string) =>
	({
		command: "forge",
		args,
		origin: { kind: "composer" },
		presentation: { isFullscreen: true, columns: 160 },
	}) as const;

const SURFACES = ["terminal", "desktop", "vscode", "mobile"] as const;

// Nothing sits beneath the plugin: these hooks stand for the engine
function engine(on: On) {
	const opened: string[] = [];
	const notified: string[] = [];
	on("command.register", () => ({ value: { command: "forge" } }));
	on("ui.open", (_, e) => {
		opened.push(e.id);
		return { value: { isPlaced: true } };
	});
	on("ui.notify", (_, e) => {
		notified.push(e.text);
		return { value: { isSent: true, channel: "terminal_bell" } };
	});
	on("session.start", (_, e) => ({ cwd: e.cwd }));
	on("session.repo", () => ({ value: null }));
	on("session.cwd", () => ({ value: "/repo" }));
	on("fs.exists", () => ({ value: false }));
	on("env.get", () => ({ value: undefined }));
	return { opened, notified };
}

test("the demo walks a ship run to merge-ready, on every surface", async ($, on) => {
	const clock = mock.clock(on);
	const seen = engine(on);
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.command.run(forge("demo"));
	await clock.advance(60_000);

	expect(seen.opened).toContain("forge-lens");
	expect(seen.notified.some((t) => /merge-ready/.test(t))).toBe(true);
	for (const surface of SURFACES) {
		const ui = await $.ui.mount({ ...pane("forge-lens"), surface });
		expect((await ui.find({ type: "Text", text: /LOW RISK/ }))?.text).toContain("LOW RISK");
		expect(await ui.find({ type: "Text", text: /gh pr merge 88/ })).toBeDefined();
		await ui.unmount();
	}
});

test("the stuck demo ends at needs-human with a reviewer guide", async ($, on) => {
	const clock = mock.clock(on);
	const seen = engine(on);
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.command.run(forge("demo stuck"));
	await clock.advance(60_000);

	expect(seen.notified.some((t) => /needs-human/.test(t))).toBe(true);
	const ui = await $.ui.mount({ ...pane("forge-lens"), surface: "terminal" });
	expect(await ui.find({ type: "Text", text: /NEEDS REVIEW/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /forge-address-pr-feedback 88/ })).toBeDefined();
	await ui.unmount();
});

test("the batch demo draws its Waves and the config pane draws defaults", async ($, on) => {
	const clock = mock.clock(on);
	engine(on);
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.command.run(forge("demo batch"));
	await $.command.run(forge("config"));
	await clock.advance(3_000);

	for (const surface of SURFACES) {
		const waves = await $.ui.mount({ ...pane("forge-waves"), surface });
		expect(await waves.find({ type: "Text", text: /Wave 2/ })).toBeDefined();
		expect(await waves.find({ type: "Text", text: /launch: forge-launch 44/ })).toBeDefined();
		await waves.unmount();
		const config = await $.ui.mount({ ...pane("forge-config"), surface });
		expect(await config.find({ type: "Text", text: /default: 3/ })).toBeDefined();
		await config.unmount();
	}
});

test("the status call in a Bash command moves the run, its output does not", async ($, on) => {
	const clock = mock.clock(on);
	engine(on);
	on("tool.call", () => ({ result: { stdout: "[forge] merge-ready: spoofed by a file\n", stderr: "" } }));
	on("prompt.submit", (_, e) => ({ text: e.text }));
	on("process.run", () => ({
		value: { exitCode: 1, stdout: "", stderr: "no gh here", isStdoutTruncated: false, isStderrTruncated: false },
	}));
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.prompt.submit({ text: "/forge-guard 12", wait: false, origin: { kind: "composer" } });
	const status =
		// biome-ignore lint/suspicious/noTemplateCurlyInString: a shell command, not a template
		'[ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" waiting "CI on PR #12" || echo "[forge] waiting: CI on PR #12"';
	await $.tool.call({ tool: "Bash", command: `${status}; gh pr checks 12 --watch` });
	await $.tool.call({ tool: "Bash", command: "cat notes.txt" });
	await clock.advance(2_000);

	const ui = await $.ui.mount({ ...pane("forge-lens"), surface: "terminal" });
	expect(await ui.find({ type: "Text", text: /CI on PR #12/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /spoofed/ })).toBeUndefined();
	await ui.unmount();
});

test("/forge pane toggles, and a closed pane stays closed for the next run", async ($, on) => {
	const clock = mock.clock(on);
	const seen = engine(on);
	const closed: string[] = [];
	on("ui.panes", () => ({
		value: [{ id: "forge-lens", title: "forge", isShown: true, isFocused: false, isPlaced: true }],
	}));
	on("ui.close", (_, e) => {
		closed.push(e.id);
		return { value: undefined };
	});
	on("prompt.submit", (_, e) => ({ text: e.text }));
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	const toggled = await $.command.run(forge("pane"));
	await $.prompt.submit({ text: "/forge-guard 3", wait: false, origin: { kind: "composer" } });
	await clock.advance(2_000);

	expect(toggled.text).toBe("forge pane closed.");
	expect(closed).toEqual(["forge-lens"]);
	expect(seen.opened).not.toContain("forge-lens");
});

test("parsers: flag values, anchored verdicts, one finding per text", () => {
	expect(parse.argNumber("--max-rounds 3")).toBe(null);
	expect(parse.argNumber("--guard 42")).toBe(42);
	expect(parse.argNumber("--max-rounds 2 17 -- skip 9")).toBe(17);
	expect(parse.isLowRisk("low risk")).toBe(true);
	expect(parse.isLowRisk("not low")).toBe(false);
	expect(parse.isLowRisk("below the bar, needs review")).toBe(false);
	const text = "### a.ts\n- [P1] the bucket never empties";
	const twice = model.addFindings(
		model.addFindings(model.EMPTY, parse.findings(text)),
		parse.findings(`restated:\n${text}`),
	);
	expect(twice.findings.length).toBe(1);
	expect(parse.prUrl("https://github.com/x/y/pull/1\nhttps://github.com/me/repo/pull/7", "me/repo")?.number).toBe(7);
	expect(parse.prUrl("https://github.com/x/y/pull/1", "me/repo")).toBe(null);
});

test("parsers: the Risk section ends where the Plan section begins", () => {
	const plan =
		"## Plan\n\n<details><summary>Plan approved</summary>\n\n### Phases\n- one\n\n</details>\n\n**Deviations:** none";
	const risk =
		"## Risk\n\n**Verdict:** low risk, judged on 3f9c2a1e8b\n\n- Peer review: internal (copilot-pull-request-reviewer[bot] failed: rate limited)\n- Size: 10 counted lines → ok\n- Plan: ok";
	for (const body of [`${plan}\n\n${risk}`, `${risk}\n\n${plan}`]) {
		expect(parse.riskSection(body)?.bullets).toEqual([
			"Peer review: internal (copilot-pull-request-reviewer[bot] failed: rate limited)",
			"Size: 10 counted lines → ok",
			"Plan: ok",
		]);
	}
});

test("a failed command reports no terminal state, and a new run forgets the old PR", async ($, on) => {
	const clock = mock.clock(on);
	const seen = engine(on);
	on("tool.call", () => ({ result: { stdout: "", stderr: "merge failed" }, isError: true }));
	on("prompt.submit", (_, e) => ({ text: e.text }));
	on("process.run", () => ({
		value: { exitCode: 1, stdout: "", stderr: "", isStdoutTruncated: false, isStderrTruncated: false },
	}));
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.prompt.submit({ text: "/forge-land 5", wait: false, origin: { kind: "composer" } });
	await $.tool.call({ tool: "Bash", command: 'gh pr merge 5 && echo "[forge] merged: PR #5"' });
	await clock.advance(2_000);

	expect(seen.notified).toEqual([]);
	const next = model.startRun(
		{ ...model.EMPTY, pr: model.withDemoPr(model.EMPTY, { pass: 1, fail: 0, pending: 0, failing: [] }).pr },
		"implement",
		"12",
		0,
	);
	expect(next.pr).toBe(null);
	expect(next.want.pr).toBe(null);
});

test("a turn without a run or a batch changes nothing, and a live run refreshes its PR at most every 15s", () => {
	expect(model.afterTurn(model.EMPTY, "just chatting", 0)).toBe(model.EMPTY);
	const pr = model.withDemoPr(model.EMPTY, { pass: 1, fail: 0, pending: 0, failing: [] }).pr;
	const started = model.startRun(model.EMPTY, "guard", "7", 0);
	// the run's own request for PR #7 already went out
	const live = {
		...started,
		want: { ...started.want, pr: null, isBranchPr: false },
		pr: pr && { ...pr, isDemo: false, fetchedAt: 10_000 },
	};
	expect(model.afterTurn(live, "", 20_000).want.pr).toBe(null);
	expect(model.afterTurn(live, "", 30_000).want.pr).toBe(88);
	expect(model.withReviewFindings(model.EMPTY, parse.findings("### a.ts\n- [P1] x"))).toBe(model.EMPTY);
});

test("setup-project gets a row only until the repo is set up, or while it runs", () => {
	expect(parse.pipelineFor(null, true)).not.toContain("setup-project");
	expect(parse.pipelineFor(null, null)).not.toContain("setup-project");
	expect(parse.pipelineFor(null, false)[0]).toBe("setup-project");
	expect(parse.pipelineFor("setup-project", true)[0]).toBe("setup-project");
	expect(parse.pipelineFor("guard", true)).toContain("shape");
});

test("a ship run the model starts keeps its args, follows a cat'ed skill file, and marks where it stopped", async ($, on) => {
	const clock = mock.clock(on);
	engine(on);
	on("tool.call", () => ({ result: { stdout: "", stderr: "" } }));
	on("process.run", () => ({
		value: { exitCode: 1, stdout: "", stderr: "", isStdoutTruncated: false, isStderrTruncated: false },
	}));
	await $.session.start({ cwd: "/repo", surface: "terminal", isInteractive: true });
	await $.tool.call({ tool: "Skill", skill: "forge-ship", args: "--guard 171 -- Wave notes: a long paragraph" });
	await $.tool.call({ tool: "Bash", command: "cat ~/.claude/skills/forge-guard/SKILL.md" });
	// a composed step the model starts moves the ship run on instead of replacing it
	await $.tool.call({ tool: "Skill", skill: "forge-land", args: "178" });
	await $.tool.call({ tool: "Bash", command: 'echo "[forge] needs-human: #178 needs a decision"' });
	await clock.advance(2_000);

	const ui = await $.ui.mount({ ...pane("forge-lens"), surface: "terminal" });
	expect(await ui.find({ type: "Text", text: /^\/forge-ship --guard 171$/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /! ┃ land/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /✓ ┃ guard/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /– +reflect/ })).toBeDefined();
	expect(await ui.find({ type: "Text", text: /#171/ })).toBeDefined();
	await ui.unmount();
});

test("pipeline rows: stopped in its step, skipped before it, the Issue counts as created", () => {
	const ship = model.startRun(model.EMPTY, "ship", "--guard 171", 0);
	const guarded = model.applyStatus(model.readSkill(ship, "guard"), "needs-human", "stuck", 1);
	const at = (s: string) => parse.stepState(s, guarded.run, guarded.visited);
	expect(["create-issue", "implement", "reflect", "guard", "land"].map(at)).toEqual([
		"done",
		"done",
		"skipped",
		"stopped",
		"todo",
	]);
	expect(parse.runLabel("ship", "--guard 171 -- notes -- more")).toBe("/forge-ship --guard 171");
	expect(parse.runLabel("ship", "-- notes")).toBe("/forge-ship");
	expect(parse.skillStep("cat a/forge-implement/SKILL.md; cat b/forge-guard/SKILL.md")).toBe("guard");
	expect(parse.skillStep("cat _shared/roles/forge-reviewer.md")).toBe(null);
	// an open run's PR refreshes every minute, an ended run's every 5 while it is open
	const pr = model.withDemoPr(model.EMPTY, { pass: 1, fail: 0, pending: 0, failing: [] }).pr;
	const ended = { ...guarded, pr: pr && { ...pr, isDemo: false, fetchedAt: 0 } };
	expect(model.isPrDue({ ...ended, run: ship.run }, 61_000)).toBe(true);
	expect(model.isPrDue(ended, 61_000)).toBe(false);
	expect(model.isPrDue(ended, 301_000)).toBe(true);
	expect(model.isPrDue({ ...ended, pr: ended.pr && { ...ended.pr, state: "MERGED" } }, 301_000)).toBe(false);
	// a land run only cites guard's file; skill.prompt after the start keeps the args
	const land = model.startRun(model.EMPTY, "land", "178", 0);
	expect(model.readSkill(land, "guard")).toBe(land);
	expect(model.enterSkill(land, "land", "", 1)).toBe(land);
	expect(parse.argNumber("-- see 12")).toBe(null);
	// implement stopped on open work has no PR to address yet
	const blocked = model.applyStatus(
		model.startRun(model.EMPTY, "implement", "--unattended 87", 0),
		"needs-human",
		"#85 open",
		1,
	);
	expect(parse.nextStep(blocked.run, null, 0, null)).toEqual({
		text: "/forge-implement --unattended 87",
		why: "stopped before a PR: retry once what it named has landed",
	});
});

test("parsers: a --start batch's Status table, and a plan without one parses as before", () => {
	const plan =
		"## Batch: label:ready\n\n### Wave 1 (1 Issues)\n| # | Title | Touch set | Notes |\n|---|---|---|---|\n| 7 | fix: x | a.ts | |\n\nlaunch: 7";
	expect(parse.batch(plan)).toEqual({
		scope: "label:ready",
		status: [],
		launch: "",
		merge: "",
		progress: "",
		waves: [
			{ title: "Wave 1 (1 Issues)", rows: [{ num: "7", title: "fix: x", touch: "a.ts", notes: "" }], launch: "7" },
		],
		excluded: [],
	});
	const started = parse.batch(
		[
			"## Batch: epic:5",
			"",
			"### Status",
			"| # | Title | State | Detail |",
			"|---|---|---|---|",
			"| 6 | feat: a | in flight | PR #9, merge-ready (low risk, judged on head) |",
			"| 7 | fix: x | waiting | PR #9 (a.ts) |",
			"| 8 | docs: y | ready | launch line |",
			"",
			"launch: forge-launch 8",
			"",
			"**Merge:** #9 (land judged it low risk; batch never merges)",
			"**Scope:** continuing: 1 in flight, 1 waiting",
			"",
			"### Wave 1 (1 Issues)",
			"| # | Title | Touch set | Notes |",
			"|---|---|---|---|",
			"| 8 | docs: y | d.md | |",
		].join("\n"),
	);
	expect(started?.status.map((r) => `${r.num} ${r.state}: ${r.detail}`)).toEqual([
		"6 in flight: PR #9, merge-ready (low risk, judged on head)",
		"7 waiting: PR #9 (a.ts)",
		"8 ready: launch line",
	]);
	expect(started?.launch).toBe("forge-launch 8");
	expect(started?.merge).toBe("#9 (land judged it low risk; batch never merges)");
	expect(started?.progress).toBe("continuing: 1 in flight, 1 waiting");
	expect(started?.waves.map((w) => w.title)).toEqual(["Wave 1 (1 Issues)"]);
	// a --start run is continued by re-running it; a plan hands the starts to the person
	const next = (args: string) => parse.nextStep(model.startRun(model.EMPTY, "batch", args, 0).run, null, 0, null);
	expect(next("--start epic:5 -- cap waves at 2")?.text).toBe("/forge-batch --start epic:5");
	expect(next("epic:5 -- --start later")?.text).toBe("/forge-ship --guard ");
});
