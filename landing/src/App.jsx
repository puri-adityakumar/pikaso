import React, { useEffect, useState } from "react";
import { marked } from "marked";

/* ---------- tiny bits ---------- */

const Pin = ({ color, className = "" }) => (
  <span className={"pin " + className} style={{ background: color }} />
);

const Arrow = ({ className = "" }) => (
  <svg className={className} width="42" height="14" viewBox="0 0 42 14" fill="none" aria-hidden="true">
    <path d="M0 7h38M32 1l7 6-7 6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/* ---------- hash router: "#/route" pages, bare "#anchor" home scrolling ---------- */

function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  if (hash.startsWith("#/")) {
    return hash.slice(2).split("?")[0].replace(/\/+$/, "").toLowerCase();
  }
  return "home";
}

/* ---------- markdown ---------- */

const MD_URL = (file) => new URL("docs/" + file, document.baseURI).href;

function Markdown({ file }) {
  const [html, setHtml] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    setHtml("");
    setErr(false);
    fetch(MD_URL(file))
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => {
        if (live) setHtml(marked.parse(t).replaceAll('href="/docs/', 'href="#/docs/').replaceAll(".md\"", "\""));
      })
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, [file]);
  if (err) {
    return (
      <div className="page-body">
        <p className="lede">This page drifted off — the markdown file didn't load.</p>
      </div>
    );
  }
  return <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- shared page chrome ---------- */

function Page({ eyebrow, title, lede, center, children }) {
  return (
    <section className={"page" + (center ? " page-center" : "")}>
      <div className="page-head">
        <p className="eyebrow fade-in">{eyebrow}</p>
        <h1 className="fade-in d1">{title}</h1>
        {lede && <p className="lede fade-in d2">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- user flows: SVG diagrams ---------- */

function FlowNode({ x, y, w, h, tint, dark, title, children }) {
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} rx={12} fill={tint} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill={dark ? "#1d1c19" : "#fff"} stroke={dark ? "#1d1c19" : "rgba(43,42,38,0.14)"} />
      <text x={x + 16} y={y + 28} className={"svg-eyebrow" + (dark ? " svg-dark" : "")}>{title}</text>
      {children}
    </g>
  );
}

function FlowArrow({ x1, y, x2, id }) {
  return (
    <line x1={x1} y1={y} x2={x2} y2={y} stroke="#2b2a26" strokeWidth="1.6" markerEnd={`url(#${id})`} />
  );
}

function FlowArrowDefs({ id }) {
  return (
    <defs>
      <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#2b2a26" />
      </marker>
    </defs>
  );
}

function FlowsCold() {
  return (
    <svg viewBox="0 0 1040 250" role="img" aria-label="Cold path: you ask, the council designs, a frame appears on the board">
      <FlowArrowDefs id="arr-cold" />
      <FlowNode x={16} y={86} w={180} h={84} tint="var(--green)" title="YOU">
        <text x={32} y={54 + 86} className="svg-title">terminal</text>
        <text x={32} y={72 + 86} className="svg-sub">"design a pricing page"</text>
      </FlowNode>
      <FlowArrow id="arr-cold" x1={196} y={128} x2={236} />
      <FlowNode x={244} y={48} w={280} h={160} tint="var(--sky)" title="ART DIRECTOR">
        <text x={260} y={62 + 48} className="svg-row">├ Scout     → design-system.md</text>
        <text x={260} y={82 + 48} className="svg-row">├ Builders×N → mockup.html</text>
        <text x={260} y={102 + 48} className="svg-row">└ Critics   → rubric verdict</text>
        <text x={260} y={130 + 48} className="svg-mono">.pikaso/frames/pricing/mockup.html</text>
      </FlowNode>
      <FlowArrow id="arr-cold" x1={524} y={128} x2={564} />
      <FlowNode x={572} y={86} w={200} h={84} tint="var(--butter-deep)" title="BOARD">
        <text x={588} y={54 + 86} className="svg-title">frame appears</text>
        <text x={588} y={72 + 86} className="svg-sub">localhost:7625 · live</text>
      </FlowNode>
      <text x={800} y={100} className="svg-eyebrow">COUNCIL RUNS</text>
      <text x={800} y={122} className="svg-sub">before you ever</text>
      <text x={800} y={140} className="svg-sub">see the first draft</text>
    </svg>
  );
}

function FlowsAnnotate() {
  return (
    <svg viewBox="0 0 1040 250" role="img" aria-label="Annotate: click an element, leave a comment, a pin appears">
      <FlowArrowDefs id="arr-ann" />
      <FlowNode x={16} y={48} w={290} h={160} tint="var(--green)" title="1 · CLICK ANY ELEMENT">
        <rect x={36} y={88} width={250} height={100} rx={8} fill="var(--paper)" stroke="rgba(43,42,38,0.14)" />
        <rect x={52} y={106} width={140} height={16} rx={4} fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="5 4" />
        <rect x={54} y={112} width={110} height={5} rx={2.5} fill="rgba(43,42,38,0.35)" />
        <rect x={52} y={136} width={190} height={5} rx={2.5} fill="rgba(43,42,38,0.16)" />
        <rect x={52} y={150} width={160} height={5} rx={2.5} fill="rgba(43,42,38,0.16)" />
        <path d="M212 110 l11 4.5 -5 2 -2 5.5 z" fill="#2b2a26" />
      </FlowNode>
      <FlowArrow id="arr-ann" x1={306} y={128} x2={346} />
      <FlowNode x={354} y={48} w={290} h={160} tint="var(--butter-deep)" title="2 · LEAVE A COMMENT">
        <rect x={374} y={84} width={250} height={64} rx={8} fill="var(--paper)" stroke="rgba(43,42,38,0.14)" />
        <text x={390} y={110} className="svg-row">"make the headline pop"</text>
        <text x={390} y={130} className="svg-sub">you · 14:32</text>
        <rect x={556} y={120} width={56} height={22} rx={6} fill="var(--dark)" />
        <text x={584} y={135} textAnchor="middle" className="svg-eyebrow svg-dark">SAVE</text>
      </FlowNode>
      <FlowArrow id="arr-ann" x1={644} y={128} x2={684} />
      <FlowNode x={692} y={48} w={290} h={160} tint="var(--pink)" title="3 · PIN APPEARS">
        <circle cx={760} cy={128} r={26} fill="var(--green)" stroke="rgba(43,42,38,0.2)" />
        <circle cx={760} cy={120} r={9} fill="rgba(255,255,255,0.45)" />
        <text x={760} y={134} textAnchor="middle" className="svg-title">1</text>
        <text x={806} y={118} className="svg-mono">◉ 1 open</text>
        <text x={806} y={138} className="svg-sub">anchored to the</text>
        <text x={806} y={154} className="svg-sub">selector, not prose</text>
      </FlowNode>
    </svg>
  );
}

function FlowsApply() {
  return (
    <svg viewBox="0 0 1040 250" role="img" aria-label="Apply: the agent edits the mockup and the board live-reloads">
      <FlowArrowDefs id="arr-app" />
      <FlowNode x={16} y={86} w={190} h={84} tint="var(--green)" title="YOU">
        <text x={32} y={54 + 86} className="svg-title">"apply the</text>
        <text x={32} y={72 + 86} className="svg-title">annotations"</text>
      </FlowNode>
      <FlowArrow id="arr-app" x1={206} y={128} x2={246} />
      <FlowNode x={254} y={64} w={260} h={128} tint="var(--butter-deep)" title="AGENT">
        <text x={270} y={66 + 64} className="svg-row">reads annotations.json</text>
        <text x={270} y={88 + 64} className="svg-row">edits mockup.html</text>
        <text x={270} y={110 + 64} className="svg-row">batch — never per-comment</text>
      </FlowNode>
      <FlowArrow id="arr-app" x1={514} y={128} x2={554} />
      <FlowNode x={562} y={86} w={180} h={84} tint="var(--sky)" title="SSE">
        <text x={578} y={54 + 86} className="svg-title">live-reload</text>
        <text x={578} y={72 + 86} className="svg-sub">event: reload</text>
      </FlowNode>
      <FlowArrow id="arr-app" x1={742} y={128} x2={782} />
      <FlowNode x={790} y={64} w={234} h={128} tint="var(--green)" title="BOARD">
        <text x={806} y={66 + 64} className="svg-row">iframe refreshes —</text>
        <text x={806} y={88 + 64} className="svg-row">no page reload</text>
        <text x={806} y={110 + 64} className="svg-mono">◎ 0 open · pin ① grey</text>
      </FlowNode>
    </svg>
  );
}

function FlowsLock() {
  return (
    <svg viewBox="0 0 1040 250" role="img" aria-label="Lock: the draft condenses into DESIGN-SPEC.md and hands off to implementation">
      <FlowArrowDefs id="arr-lock" />
      <FlowNode x={16} y={86} w={200} h={84} tint="var(--pink)" title="CLICK LOCK">
        <text x={32} y={54 + 86} className="svg-title">🔒 one click</text>
        <text x={32} y={72 + 86} className="svg-sub">409 if pins still open</text>
      </FlowNode>
      <FlowArrow id="arr-lock" x1={216} y={128} x2={256} />
      <FlowNode x={264} y={56} w={280} h={140} tint="var(--butter-deep)" dark title="DESIGN-SPEC.MD">
        <text x={280} y={62 + 56} className="svg-row">Purpose · per frame</text>
        <text x={280} y={84 + 56} className="svg-row">Token contract</text>
        <text x={280} y={106 + 56} className="svg-row">Final state</text>
        <text x={280} y={128 + 56} className="svg-row">resolved annotation history</text>
      </FlowNode>
      <FlowArrow id="arr-lock" x1={544} y={128} x2={584} />
      <FlowNode x={592} y={86} w={190} h={84} tint="var(--sky)" title="COPY PROMPT">
        <text x={608} y={54 + 86} className="svg-title">to clipboard</text>
        <text x={608} y={72 + 86} className="svg-sub">paste into your agent</text>
      </FlowNode>
      <FlowArrow id="arr-lock" x1={782} y={128} x2={822} />
      <FlowNode x={830} y={86} w={194} h={84} tint="var(--green)" title="BUILD">
        <text x={846} y={54 + 86} className="svg-title">implementation</text>
        <text x={846} y={72 + 86} className="svg-sub">guided by the spec</text>
      </FlowNode>
    </svg>
  );
}

function FlowsVisual() {
  const flows = [
    ["01 · Generate — cold path", "You ask in the terminal; Scout reads your codebase, Builders write the frame, Critics review it before you see it.", <FlowsCold key="c" />],
    ["02 · Review — on the board", "Click any element, leave a comment, and a numbered pin sticks to that exact selector.", <FlowsAnnotate key="a" />],
    ["03 · Apply — hot path", "The agent reads the pins, edits the mockup, and the frame live-reloads while resolved pins grey out.", <FlowsApply key="ap" />],
    ["04 · Lock — handoff", "One click condenses every decision into DESIGN-SPEC.md and copies the implementation prompt.", <FlowsLock key="l" />],
  ];
  return (
    <div className="flows-grid">
      {flows.map(([t, d, svg], i) => (
        <figure className={"card flow-card fade-in d" + ((i % 3) + 1)} key={t}>
          {svg}
          <figcaption>
            <h3>{t}</h3>
            <p>{d}</p>
          </figcaption>
        </figure>
      ))}
      <div className="md-body fade-in d2">
        <h2>Who does what</h2>
        <table>
          <thead><tr><th>Step</th><th>You are…</th><th>Where</th></tr></thead>
          <tbody>
            <tr><td>1. Generate</td><td>talker in terminal</td><td>agent + Council</td></tr>
            <tr><td>2. Review</td><td>designer on the board</td><td>browser, click + pin</td></tr>
            <tr><td>3. Apply</td><td>reviewer watching live reload</td><td>terminal ↔ board</td></tr>
            <tr><td>4. Lock</td><td>decision maker</td><td>one click → spec → build</td></tr>
          </tbody>
        </table>
        <p className="small">
          Prefer plain text? The ASCII version of these flows lives at{" "}
          <a href="docs/flows.md" target="_blank" rel="noreferrer">docs/flows.md</a>.
        </p>
      </div>
    </div>
  );
}

/* ---------- docs ---------- */

const DOC_PAGES = [
  ["install", "Install"],
  ["quickstart", "Quickstart"],
  ["flows", "User flows"],
  ["board", "Board basics"],
  ["annotations", "Annotations"],
  ["lock", "Lock & handoff"],
  ["agent-setup", "Agent setup"],
  ["protocol", "Pikaso Protocol"],
  ["changelog", "Changelog"],
];

function Docs({ sub }) {
  const slug = DOC_PAGES.some(([s]) => s === sub) ? sub : "install";
  const meta = DOC_PAGES.find(([s]) => s === slug);
  return (
    <section className="page docs-page">
      <div className="docs-layout">
        <aside className="docs-side">
          <p className="side-title">Docs</p>
          {DOC_PAGES.map(([s, label]) => (
            <a
              key={s}
              className={"side-link" + (s === slug ? " active" : "")}
              href={"#/docs/" + s}
            >
              {label}
            </a>
          ))}
          <a className="side-link raw" href={"docs/" + slug + ".md"} target="_blank" rel="noreferrer">
            view raw ↗
          </a>
        </aside>
        <article className="docs-content">
          <div className="code-card md-file" aria-hidden="true">
            <div className="code-head">docs/{slug}.md</div>
          </div>
          {slug === "flows" ? <FlowsVisual /> : <Markdown file={slug + ".md"} />}
          <nav className="doc-pager">
            {DOC_PAGES.map(([s, label], i) =>
              s === slug && DOC_PAGES[i + 1] ? (
                <a className="btn btn-butter" key="next" href={"#/docs/" + DOC_PAGES[i + 1][0]}>
                  Next: {DOC_PAGES[i + 1][1]} <Arrow />
                </a>
              ) : null
            )}
          </nav>
        </article>
      </div>
    </section>
  );
}

/* ---------- examples ---------- */

function Examples() {
  const shots = [
    ["img/shot-frames.png", "The board", "Three frames mid-review — live labels count open pins per frame."],
    ["img/shot-pin.png", "The pin", "Click an element, leave a comment. The pin stores the selector, not a screenshot."],
    ["img/council-bots.png", "The council", "Scout, Art Director, Builders, Critics — a design team that meets before you click."],
    ["img/pins-still.png", "The spec", "Lock condenses every resolved pin into DESIGN-SPEC.md for the implementation agent."],
  ];
  return (
    <Page
      eyebrow="Examples"
      title="Pikaso in the wild."
      lede="The demo board, real pins, and the artifacts they turn into. Everything below came out of one working session."
    >
      <div className="video-shell fade-in d2">
        <video src="img/demo.mp4" controls preload="metadata" poster="img/pins-still.png" />
        <p className="small video-cap">The 1:46 demo: annotate → apply → live reload → lock.</p>
      </div>
      <div className="gallery">
        {shots.map(([src, t, d], i) => (
          <figure className={"card gallery-card fade-in d" + ((i % 3) + 1)} key={t}>
            <img src={src} alt={t} loading="lazy" />
            <figcaption>
              <h3>{t}</h3>
              <p>{d}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="examples-foot">
        <div className="card code-card fade-in d1">
          <div className="code-head">what the agent receives</div>
          <pre>{`[
  {
    "selector": "header > nav > button.cta",
    "box": { "x": 412, "y": 88, "w": 96, "h": 32 },
    "text": "full-width, orange",
    "status": "open"
  }
]`}</pre>
        </div>
        <div className="examples-note fade-in d2">
          <h3>Building an agent, not using one?</h3>
          <p>
            The whole board is files and REST. Point your harness at{" "}
            <a href="llms.txt">llms.txt</a> — an index of the protocol and every
            doc as plain markdown — and it can drive Pikaso without a browser.
          </p>
          <a className="ghost-link" href="#/docs/protocol">Read the protocol</a>
        </div>
      </div>
    </Page>
  );
}

/* ---------- changelog ---------- */

function Changelog() {
  return (
    <Page
      center
      eyebrow="Changelog"
      title="What shipped."
      lede="Newest first. Raw markdown at docs/changelog.md — and llms.txt for agents."
    >
      <div className="no-md-title"><Markdown file="changelog.md" /></div>
    </Page>
  );
}

/* ---------- protocol page ---------- */

function ProtocolPage() {
  return (
    <Page
      center
      eyebrow="Open protocol"
      title="Any harness speaks Pikaso."
      lede="The runtime state is files: the server is a bridge, the skill is text. Nothing is locked to one tool."
    >
      <div className="no-md-title"><Markdown file="protocol.md" /></div>
    </Page>
  );
}

/* ---------- nav + hero board illustration (unchanged design) ---------- */

function Nav({ route }) {
  const onDocs = route === "docs" || route.startsWith("docs/");
  return (
    <header className="nav">
      <a className="brand" href="#top">
        <Pin color="var(--green)" /> <span>pikaso</span>
      </a>
      <nav className="nav-links">
        <a href="#loop">How it works</a>
        <a href="#why">Why</a>
        <a href="#council">Council</a>
        <a className={onDocs ? "nav-on" : ""} href="#/docs">Docs</a>
        <a className={route === "examples" ? "nav-on" : ""} href="#/examples">Examples</a>
        <a className={route === "changelog" ? "nav-on" : ""} href="#/changelog">Changelog</a>
      </nav>
      <div className="nav-cta">
        <a className="ghost-link" href="https://github.com/puri-adityakumar/pikaso">GitHub</a>
        <a className="btn btn-green" href="#get">Start building</a>
      </div>
    </header>
  );
}

function BoardIllustration() {
  return (
    <div className="board" aria-hidden="true">
      <div className="board-frame frame-a">
        <div className="frame-label">LANDING PAGE <em>o 2 open</em></div>
        <div className="mock">
          <div className="mock-nav">
            <span className="dot-line w40" />
            <span className="dot-line w20" /><span className="dot-line w20" /><span className="dot-line w20" />
          </div>
          <div className="mock-hero">
            <span className="dot-line w70" /><span className="dot-line w50" />
          </div>
          <div className="mock-row">
            <div className="mock-card" /><div className="mock-card" /><div className="mock-card" />
          </div>
          <Pin color="var(--green)" className="pin-1" />
          <Pin color="var(--butter-deep)" className="pin-2" />
          <Pin color="var(--pink)" className="pin-3" />
        </div>
        <div className="popover">
          <p>"CTA should be full-width and orange"</p>
          <div className="popover-foot">
            <span>you · 14:32</span>
            <button type="button">Resolve</button>
          </div>
        </div>
      </div>
      <div className="board-frame frame-b">
        <div className="frame-label">CHECKOUT <em>o 0 open</em></div>
        <div className="mock">
          <div className="mock-field" /><div className="mock-field" />
          <div className="mock-btn" />
        </div>
      </div>
      <div className="board-terminal">
        <div className="term-head"><span /><span /><span /></div>
        <div className="term-body">
          <p>&gt; applying 2 annotations…</p>
          <p className="ok">✓ header.cta — updated</p>
          <p className="ok">✓ hero.sub — updated</p>
          <p className="dim">&gt; live reload sent</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow" data-reveal>Design review for agent-driven development</p>
        <h1 data-reveal data-delay="1">Design review belongs on the mockup.</h1>
        <p className="lede" data-reveal data-delay="2">
          Coding agents ship HTML in seconds, but your feedback travels as
          prose, so intent gets lost and everything becomes rework. Pikaso puts
          the mockup on a canvas: <strong>point</strong> at any element, leave a
          comment, and your agent applies every mark live.
        </p>
        <div className="hero-cta" data-reveal data-delay="3">
          <a className="btn btn-butter" href="#get">
            npx pikaso-design <Arrow />
          </a>
          <a className="ghost-link" href="#loop">See the loop</a>
        </div>
      </div>
      <div className="hero-art">
        <img src="img/hero-art.png" alt="" />
        <BoardIllustration />
      </div>
    </section>
  );
}

/* ---------- mint: the loop ---------- */

function Loop() {
  const steps = [
    {
      n: "01",
      t: "Annotate",
      d: "Click any element on the mockup and leave a comment. It becomes a pin, anchored to that element, not to a paragraph of prose.",
    },
    {
      n: "02",
      t: "Apply",
      d: "Your agent reads the pins as structured annotations (selector, position, comment), edits the mockup, and marks each one resolved. The board live-reloads.",
    },
    {
      n: "03",
      t: "Lock",
      d: "When the draft is right, lock it. Every decision condenses into a DESIGN-SPEC.md, so design intent survives the handoff to implementation.",
    },
  ];
  return (
    <section className="loop" id="loop">
      <div className="cluster" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span /><span />
      </div>
      <h2 className="ghost" data-reveal>The Loop</h2>
      <p className="statement" data-reveal data-delay="1">
        Three moves.
        <br />
        Nothing lost.
      </p>
      <div className="loop-cards">
        {steps.map((s, i) => (
          <article className={"card loop-card r" + i} key={s.n} data-reveal data-delay={String(i)}>
            <span className="card-n">{s.n}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- butter: why ---------- */

function Why() {
  return (
    <section className="why split" id="why">
      <div className="split-copy" data-reveal>
        <p className="eyebrow">The lossy channel</p>
        <h2>Chat is a lossy channel for design.</h2>
        <p>
          Agents are better at HTML than we expected, and worse at design
          review than we need. The loop today looks like this: the agent
          generates a screen, you describe what's wrong ("the header
          feels crowded, the CTA should pop more"), it guesses, you repeat.
        </p>
        <p>
          Spatial feedback dies in translation. So Pikaso moves the
          conversation onto the artifact: every comment is pinned to a selector
          with exact position, and becomes machine-readable
          {" "}<code>annotations.json</code>. The agent stops interpreting
          adjectives and starts applying coordinates.
        </p>
        <p className="small">
          And when the draft locks, it doesn't evaporate into chat history; it
          becomes a spec the next agent can implement from.
        </p>
      </div>
      <div className="split-visual">
        <div className="card code-card" data-reveal data-delay="1">
          <div className="code-head">frames/checkout/annotations.json</div>
          <pre>{`[
  {
    "id": "a3f2",
    "selector": "header > nav > button.cta",
    "box": { "x": 412, "y": 88, "w": 96, "h": 32 },
    "text": "full-width, orange",
    "status": "open"
  }
]`}</pre>
        </div>
      </div>
    </section>
  );
}

/* ---------- sky: council ---------- */

function Council() {
  const cast = [
    ["Scout", "reads your codebase once, extracts the design system, or reports cleanly that there isn't one."],
    ["Art Director", "declares the design read, sets the dials, writes the brief. The only agent that talks to you."],
    ["Builders ×N", "parallel, write-scoped agents, one per frame, sharing one token contract so the board looks like one product."],
    ["The Council", "specialist critics convened per frame: typography, contrast, layout. Verdicts merged into one revision."],
  ];
  return (
    <section className="council split reverse" id="council">
      <div className="split-copy" data-reveal>
        <p className="eyebrow">The design council</p>
        <h2>A design team meets before you ever click.</h2>
        <p>
          First drafts shouldn't waste your first comment. Pikaso's agent cast
          is small and opinionated, with tight scope: built on our own
          orchestration, running on your harness.
        </p>
        <div className="cast">
          {cast.map(([t, d]) => (
            <div className="cast-item" key={t}>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="split-visual" data-reveal data-delay="1">
        <div className="bots-wrap">
          <img
            className="bots-art"
            src="img/council-bots.png"
            alt="The Pikaso design council: four small robots, one for Scout, Art Director, Builder, and Critic"
          />
          <div className="card council-card">
            <div className="code-head">art-director — design read</div>
            <pre className="dim-code">{`Reading this as: SaaS landing for
technical buyers, Linear-clean,
leaning Tailwind + Geist.

DIALS  variance 7 · motion 5 · density 3

Council convened: typography, contrast
→ 2 fix items merged → 1 revision`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- dark: protocol ---------- */

function Protocol() {
  return (
    <section className="protocol" id="protocol">
      <p className="eyebrow light" data-reveal>Open protocol</p>
      <h2 data-reveal>Any harness speaks Pikaso.</h2>
      <p className="lede light" data-reveal data-delay="1">
        The runtime state is files: the server is a bridge, the skill is text.
        Nothing is locked to one tool. Built and demoed on IBM Bob 2.0; works
        anywhere AGENTS.md is read.
      </p>
      <div className="proto-grid">
        <div className="card dark-card" data-reveal>
          <div className="code-head light">the whole contract</div>
          <pre>{`.pikaso/
├── project.json        # board: frames, x/y, status
├── DESIGN-SPEC.md      # written by Lock
└── frames/
    └── checkout/
        ├── mockup.html # agent-owned
        └── annotations.json  # you-owned`}</pre>
        </div>
        <div className="card dark-card" data-reveal data-delay="1">
          <div className="code-head light">the loop, as the agent sees it</div>
          <pre>{`1 read project.json
2 for each frame with open annotations:
    read annotations.json
    edit that frame's mockup.html
    mark annotations resolved
3 batch applies — never per-comment`}</pre>
        </div>
      </div>
      <div className="badges" data-reveal data-delay="2">
        <span className="badge on">Bob IDE</span>
        <span className="badge">Bob Shell</span>
        <span className="badge">Claude Code</span>
        <span className="badge">ZCode</span>
        <span className="badge">Cursor</span>
        <span className="badge">any AGENTS.md</span>
      </div>
      <p className="proto-more" data-reveal data-delay="2">
        <a className="ghost-link light" href="#/protocol">Read the full protocol spec →</a>
      </p>
    </section>
  );
}

/* ---------- CTA + footer ---------- */

function Get() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText("npx pikaso-design").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="get" id="get">
      <div className="get-copy" data-reveal>
        <h2>Point. Don't describe.</h2>
        <button className="cmd" onClick={copy} type="button">
          <code>npx pikaso-design</code>
          <span className="copy-hint">{copied ? "copied ✓" : "copy"}</span>
        </button>
        <p className="proof">
          The demo board: 9 pins, 2 batch applies, one locked DESIGN-SPEC.
        </p>
        <p className="small">
          No dependencies, nothing in your package.json. The board lives in a
          gitignored <code>.pikaso/</code>, or pass <code>--global</code> and
          your workspace never sees it at all.
        </p>
      </div>
      <img className="get-art" src="img/pins-still.png" alt="" data-reveal data-delay="1" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="foot-left">
        <Pin color="var(--green)" /> <span>pikaso</span>
        <span className="dim">· MIT</span>
      </div>
      <div className="foot-right">
        <a href="#/docs">Docs</a>
        <a href="#/examples">Examples</a>
        <a href="#/changelog">Changelog</a>
        <a href="llms.txt">llms.txt</a>
        <a href="https://github.com/puri-adityakumar/pikaso">GitHub</a>
      </div>
    </footer>
  );
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [route]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/")) {
      window.scrollTo(0, 0);
    } else if (hash.length > 1) {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [route]);

  if (route === "docs" || route.startsWith("docs/")) {
    return (
      <>
        <Nav route={route} />
        <main><Docs sub={route.slice(5)} /></main>
        <Footer />
      </>
    );
  }
  if (route === "examples") {
    return (
      <>
        <Nav route={route} />
        <main><Examples /></main>
        <Footer />
      </>
    );
  }
  if (route === "changelog") {
    return (
      <>
        <Nav route={route} />
        <main><Changelog /></main>
        <Footer />
      </>
    );
  }
  if (route === "protocol") {
    return (
      <>
        <Nav route={route} />
        <main><ProtocolPage /></main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav route={route} />
      <main>
        <Hero />
        <Loop />
        <Why />
        <Council />
        <Protocol />
        <Get />
      </main>
      <Footer />
    </>
  );
}
