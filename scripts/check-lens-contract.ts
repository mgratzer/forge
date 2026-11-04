// Checks the formats in docs/lens.md against the skill files that define them, so changing
// one without its parser fails. Run by check-skills.sh; `claude plugin test` has no file
// access, so this can't be a lens test. Prints each problem, and nothing when healthy.
import { deepStrictEqual as same } from "node:assert";
import { readFileSync } from "node:fs";

import * as parse from "../lens/hooks/parse.ts";

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// The first fenced block after a marker
const block = (text: string, marker: string): string =>
	/```\w*\n([\s\S]*?)\n```/.exec(text.slice(text.indexOf(marker)))?.[1] ?? "";

// A section's table rows, cell by cell, without the header and its rule
const rows = (text: string, heading: string): string[][] =>
	(text.split(`${heading}\n`)[1]?.split(/^## /m)[0] ?? "")
		.split("\n")
		.filter((l) => l.startsWith("|"))
		.slice(2)
		.map((l) =>
			l
				.split("|")
				.slice(1, -1)
				.map((c) => c.trim().replace(/`/g, "")),
		);

function check(format: string, run: () => void): void {
	try {
		run();
	} catch (e) {
		console.log(
			`lens contract: ${format}: ${String((e as Error).message)
				.split("\n")
				.slice(0, 8)
				.join(" ")}`,
		);
	}
}

check("the status call (status-reporting.md)", () => {
	const doc = read("skills/_shared/status-reporting.md");
	const line = block(doc, "## The Seam").split("\n").at(-1) ?? "";
	const call = line.replaceAll("<state>", "waiting").replaceAll("<detail>", "CI on PR 7");
	const expected = [{ state: "waiting", detail: "CI on PR 7" }];
	same(parse.statusCalls(call.slice(0, call.indexOf("||"))), expected);
	same(parse.statusCalls(call.slice(call.indexOf("||"))), expected);

	const states = rows(doc, "## States");
	same(states.length > 0, true);
	for (const [state = ""] of states) same(parse.statusCalls(`echo "[forge] ${state}: x"`), [{ state, detail: "x" }]);
	const terminal = states.filter((s) => s[2] === "yes").map((s) => s[0] ?? "");
	same([...terminal].sort(), [...parse.TERMINAL].sort());
});

check("a reviewer's findings (forge-reviewer.md)", () => {
	const found = parse.findings(block(read("skills/_shared/roles/forge-reviewer.md"), "## Output Format"));
	same(
		found.map((f) => f.severity),
		["P0", "P1", "P2"],
	);
	same(found[0]?.file, "<filename>");
});

check("the ## Risk section (risk-rubric.md, pr-body.md)", () => {
	const section = block(read("skills/_shared/risk-rubric.md"), "section, replaced on every verdict").replace(
		"<full SHA>",
		"3f9c2a1e8b",
	);
	// a section ends at the next `## ` heading, so the PR body after it is not read into it
	const risk = parse.riskSection(`${section}\n\n${block(read("skills/_shared/pr-body.md"), "## Format")}`);
	same(risk?.verdict, "low risk | needs review");
	same(risk?.sha, "3f9c2a1e8b");
	same(risk?.bullets[0]?.startsWith("Peer review:"), true);
	same((risk?.lookAt.length ?? 0) > 0, true);
	same(risk?.revert !== "", true);
});

check("the **Result:** line (forge-land, forge-guard, forge-ship)", () => {
	for (const skill of ["land", "guard", "ship"]) {
		const line = parse.resultLine(block(read(`skills/forge-${skill}/SKILL.md`), "## Output Format"));
		same(parse.TERMINAL.includes(line.split(" ")[0] ?? ""), true, skill);
	}
});

check("forge-batch's output (forge-batch, references/start.md)", () => {
	const plan = parse.batch(block(read("skills/forge-batch/SKILL.md"), "## Output Format"));
	same(plan?.scope, "<scope>");
	same(
		plan?.waves[0]?.rows.map((r) => r.num),
		["123", "124"],
	);
	same(plan?.waves[0]?.launch, "<launcher> 123 124 ...");
	same(plan?.excluded.length, 2);

	const doc = read("skills/forge-batch/references/start.md");
	const status = parse.batch(block(doc, "## Output"))?.status;
	same((status?.rows.length ?? 0) > 0, true);
	same(status?.launch, "<launcher> 124");
	same(status?.merge.startsWith("#401"), true);
	same(status?.progress.startsWith("continuing"), true);

	const order = parse.batch(`## Batch: x\n\n${block(doc, "after the **Scope:** line")}`)?.order;
	same(
		order?.rows.map((r) => r.pr),
		["#401", "#398", "#405"],
	);
	same(order?.gates.startsWith("pass on main"), true);
});

check("the Unattended Shipping settings (unattended-config.md)", () => {
	const doc = read("skills/_shared/unattended-config.md");
	const declared = parse.unattended(block(doc, "## Declaration"));
	same(declared.hasSection, true);
	same(declared.settings.find((s) => s.name === "Max guard rounds")?.value, "3");
	same(
		declared.settings.map(({ name, usedBy }) => ({ name, usedBy })),
		rows(doc, "## Settings").map(([name = "", usedBy = ""]) => ({ name, usedBy })),
	);
});
