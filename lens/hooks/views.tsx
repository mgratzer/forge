import type { EngineInterface } from "claude-code";

import type { Batch, Config, Finding, Next, Pr, Risk, Run, Stage } from "../types";
import { currentStep, DEFAULT_ROUNDS, isLowRisk, isOnHead, PIPELINE, runLabel, TERMINAL } from "./parse";

type Ui = ReturnType<EngineInterface["ui"]["resolve"]>;

// The steps forge-ship and forge-ship --guard compose
const SHIP = ["implement", "guard", "land"];

const STATE_COLOR: Record<string, string> = {
	implementing: "claude",
	reviewing: "suggestion",
	waiting: "warning",
	addressing: "warning",
	pushed: "success",
	"review-ready": "success",
	"merge-ready": "success",
	merged: "merged",
	"needs-human": "error",
	failed: "error",
};

const SEVERITY_COLOR: Record<string, string> = { P0: "error", P1: "warning", P2: "suggestion" };

function ago(now: number, at: number): string {
	const s = Math.max(0, Math.round((now - at) / 1000));
	return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`;
}

type LensProps = {
	ui: Ui;
	now: number;
	run: Run | null;
	timeline: Stage[];
	visited: string[];
	pr: Pr | null;
	findings: Finding[];
	risk: Risk | null;
	result: string;
	next: Next | null;
	onToggle: (id: string) => void;
	onRefresh: () => void;
};

export function Lens(p: LensProps) {
	const { Box, Text, Button, Link } = p.ui;
	const step = currentStep(p.run);
	const isShip = p.run?.skill === "ship";
	const last = p.timeline.at(-1);
	const open = p.findings.filter((f) => !f.isDone);

	return (
		<Box flexDirection="column" gap={1}>
			{p.run ? (
				<Box flexDirection="column">
					<Text bold>
						{runLabel(p.run.skill, p.run.args)}
						{p.run.isDemo ? "  (demo)" : ""}
					</Text>
					<Text dimColor>
						started {ago(p.now, p.run.startedAt)} ago
						{p.run.terminal ? `, ended ${p.run.terminal}` : ""}
					</Text>
				</Box>
			) : (
				<Box flexDirection="column">
					<Text bold>No forge run yet</Text>
					<Text dimColor>Start one with /forge-… or try /forge demo</Text>
				</Box>
			)}

			{last && last.state !== "start" && (
				<Box flexDirection="column">
					<Text dimColor>NOW</Text>
					<Text color={STATE_COLOR[last.state] ?? "text"} bold={TERMINAL.includes(last.state)}>
						{last.state}
						<Text dimColor>{last.detail ? `  ${last.detail}` : ""}</Text>
					</Text>
				</Box>
			)}

			{p.next && (
				<Box flexDirection="column">
					<Text dimColor>NEXT</Text>
					<Text color="suggestion" bold>
						{p.next.text}
					</Text>
					<Text dimColor>{p.next.why} (Tab in an empty prompt takes it)</Text>
				</Box>
			)}

			<Box flexDirection="column">
				<Text dimColor>PIPELINE{isShip ? "   ┃ = composed by ship" : ""}</Text>
				{PIPELINE.map((s) => {
					const isNow = s === step && !p.run?.terminal;
					const isDone = p.visited.includes(s) && !isNow;
					const mark = isNow ? "●" : isDone ? "✓" : "○";
					const color = isNow ? "claude" : isDone ? "success" : "inactive";
					const bar = isShip && SHIP.includes(s) ? "┃" : " ";
					let note = "";
					if (isNow && isShip && s === "implement" && last?.state === "reviewing") note = "self-review";
					if (s === "guard" && p.run && p.run.round > 0)
						note = `round ${p.run.round}/${p.run.maxRounds || DEFAULT_ROUNDS}`;
					return (
						<Text color={color}>
							{" "}
							{mark} {bar} {s.padEnd(20)}
							<Text dimColor>{note}</Text>
						</Text>
					);
				})}
			</Box>
			{p.pr && (
				<Box flexDirection="column">
					<Box flexDirection="row" justifyContent="space-between">
						<Text dimColor>PULL REQUEST</Text>
						{!p.pr.isDemo && <Button key="refresh" label="Refresh" plain onPress={p.onRefresh} />}
					</Box>
					{p.pr.isDemo ? (
						<Text>
							#{p.pr.number} {p.pr.title}
						</Text>
					) : (
						<Link href={p.pr.url} label={`#${p.pr.number} ${p.pr.title}`} />
					)}
					<Text dimColor wrap="truncate">
						{p.pr.branch} · {p.pr.state.toLowerCase()} · {p.pr.mergeable.toLowerCase()}
						{p.pr.reviewDecision ? ` · ${p.pr.reviewDecision.toLowerCase().replace(/_/g, " ")}` : ""}
					</Text>
					<Text>
						CI <Text color="success">✓{p.pr.checks.pass}</Text> <Text color="error">✗{p.pr.checks.fail}</Text>{" "}
						<Text color="warning">◌{p.pr.checks.pending}</Text>
						<Text dimColor>{p.pr.checks.failing.length ? `  failing: ${p.pr.checks.failing.join(", ")}` : ""}</Text>
					</Text>
				</Box>
			)}

			{p.findings.length > 0 && (
				<Box flexDirection="column">
					<Text dimColor>
						REVIEW FINDINGS {open.length} open / {p.findings.length}
					</Text>
					{p.findings.map((f) => (
						<Box flexDirection="row" gap={1}>
							<Button key={`f-${f.id}`} label={f.isDone ? "☑" : "☐"} plain onPress={() => p.onToggle(f.id)} />
							<Text color={f.isDone ? "inactive" : (SEVERITY_COLOR[f.severity] ?? "text")}>{f.severity}</Text>
							<Text dimColor={f.isDone} strikethrough={f.isDone} wrap="wrap">
								{f.file ? `${f.file}: ` : ""}
								{f.text}
							</Text>
						</Box>
					))}
				</Box>
			)}

			{p.risk && <RiskCard ui={p.ui} risk={p.risk} result={p.result} pr={p.pr} />}

			{p.timeline.length > 1 && (
				<Box flexDirection="column">
					<Text dimColor>TIMELINE</Text>
					{p.timeline.slice(-5).map((s) => (
						<Text wrap="truncate">
							<Text dimColor>{ago(p.now, s.at).padStart(4)} </Text>
							<Text color={STATE_COLOR[s.state] ?? "subtle"}>{s.state.padEnd(13)}</Text>
							<Text dimColor>{s.detail}</Text>
						</Text>
					))}
				</Box>
			)}
		</Box>
	);
}

type RiskCardProps = { ui: Ui; risk: Risk; result: string; pr: Pr | null };

function RiskCard({ ui, risk, result, pr }: RiskCardProps) {
	const { Box, Text } = ui;
	const isLowVerdict = isLowRisk(risk.verdict);
	const isCurrent = isOnHead(risk, pr);
	const head = pr?.headSha ?? "";
	const isLow = isLowVerdict && isCurrent;
	return (
		<Box flexDirection="column" borderStyle="round" borderColor={isLow ? "success" : "warning"} paddingX={1}>
			<Text bold color={isLow ? "success" : "warning"}>
				{isLowVerdict ? "LOW RISK" : "NEEDS REVIEW"}
				<Text dimColor>{risk.sha ? `  judged on ${risk.sha}` : ""}</Text>
			</Text>
			{!isCurrent && (
				<Text color="warning" wrap="wrap">
					⚠ stale or unverified: the head is {head ? head.slice(0, 10) : "unknown"}, run /forge-land again
				</Text>
			)}
			{result !== "" && <Text>Result: {result}</Text>}
			{risk.bullets.map((b) => (
				<Text dimColor={/→ ok|: ok$|: none$/.test(b)} wrap="wrap">
					· {b}
				</Text>
			))}
			{risk.lookAt.length > 0 && <Text bold>Where to look</Text>}
			{risk.lookAt.map((l) => (
				<Text color="warning" wrap="wrap">
					→ {l}
				</Text>
			))}
			{risk.revert !== "" && <Text color="error">Revert: {risk.revert}</Text>}
		</Box>
	);
}

export function ConfigView({ ui, config }: { ui: Ui; config: Config | null }) {
	const { Box, Text } = ui;
	if (!config) return <Text dimColor>Reading AGENTS.md…</Text>;
	return (
		<Box flexDirection="column" gap={1}>
			<Box flexDirection="column">
				<Text dimColor>PROJECT</Text>
				<Text>{config.root}</Text>
				<Text color={config.hasAgents ? "success" : "error"}>
					{config.hasAgents ? "✓ AGENTS.md" : "✗ no AGENTS.md: run /forge-setup-project"}
				</Text>
				<Text>
					Tracker <Text dimColor>{config.tracker}</Text>
				</Text>
			</Box>
			<Box flexDirection="column">
				<Text dimColor>UNATTENDED SHIPPING {config.hasSection ? "" : "(no section: every setting is a default)"}</Text>
				{config.hasStaleHeading && (
					<Text color="warning" wrap="wrap">
						⚠ AGENTS.md has a "## Shipping" heading: forge reads "## Unattended Shipping"
					</Text>
				)}
				{config.settings.map((s) => (
					<Box flexDirection="column">
						<Text>
							<Text bold={s.isSet}>{s.name}</Text>
							<Text dimColor> ({s.usedBy})</Text>
						</Text>
						<Text color={s.isSet ? "text" : "inactive"} wrap="wrap">
							{"  "}
							{s.isSet ? s.value : `default: ${s.fallback}`}
						</Text>
					</Box>
				))}
			</Box>
			<Box flexDirection="column">
				<Text dimColor>ENVIRONMENT</Text>
				{config.env.map((v) => (
					<Text>
						{v.name} <Text dimColor>{v.value || "unset (status prints as [forge] lines)"}</Text>
					</Text>
				))}
			</Box>
		</Box>
	);
}

export function WavesView({ ui, batch }: { ui: Ui; batch: Batch | null }) {
	const { Box, Text } = ui;
	if (!batch) return <Text dimColor>No batch yet: run /forge-batch, or /forge demo batch</Text>;
	return (
		<Box flexDirection="column" gap={1}>
			<Text bold>Batch: {batch.scope}</Text>
			{batch.waves.map((w, i) => (
				<Box flexDirection="column" borderStyle="round" borderColor={i === 0 ? "claude" : "inactive"} paddingX={1}>
					<Text bold color={i === 0 ? "claude" : "subtle"}>
						{w.title}
					</Text>
					{w.rows.map((r) => (
						<Box flexDirection="column">
							<Text wrap="truncate">
								<Text bold>{r.num.padEnd(5)}</Text>
								{r.title}
							</Text>
							<Text dimColor wrap="truncate">
								{"      "}
								{r.touch}
							</Text>
							{r.notes !== "" && (
								<Text color="warning">
									{"      "}
									{r.notes}
								</Text>
							)}
						</Box>
					))}
					{w.launch !== "" && <Text color="suggestion">launch: {w.launch}</Text>}
				</Box>
			))}
			{batch.excluded.length > 0 && (
				<Box flexDirection="column">
					<Text dimColor>EXCLUDED</Text>
					{batch.excluded.map((x) => (
						<Text dimColor>· {x}</Text>
					))}
				</Box>
			)}
		</Box>
	);
}

export const MAP = `forge pipeline

  setup-project      once per repo: AGENTS.md, docs, conventions
  shape              turn a rough idea into a shaped plan (optional)
  create-issue       write the Issue, AFK or HITL
  implement          code it, test it, open the PR
  reflect            capture what the session taught
  address-pr-feedback  answer review threads
  guard              CI, peer review, feedback rounds until review-ready
  land               risk verdict; merge-ready, or merged when opted in

  ship               = implement + self-review
  ship --guard       = implement + review + guard + land, unattended
  batch              plan Waves of Issues that can run in parallel

Every skill prints [forge] <state>: <detail> at each stage change.
The forge lens reads those lines: /forge pane, /forge config, /forge waves, /forge demo`;
