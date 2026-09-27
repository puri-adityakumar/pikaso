import React, { useEffect, useState } from "react";

/* ---------- tiny bits ---------- */

const Pin = ({ color, className = "" }) => (
  <span className={"pin " + className} style={{ background: color }} />
);

const Arrow = ({ className = "" }) => (
  <svg className={className} width="42" height="14" viewBox="0 0 42 14" fill="none" aria-hidden="true">
    <path d="M0 7h38M32 1l7 6-7 6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top">
        <Pin color="var(--green)" /> <span>pikaso</span>
      </a>
      <nav className="nav-links">
        <a href="#loop">How it works</a>
        <a href="#why">Why</a>
        <a href="#council">Council</a>
        <a href="#protocol">Protocol</a>
      </nav>
      <div className="nav-cta">
        <a className="ghost-link" href="https://github.com/puri-adityakumar/pikaso">GitHub</a>
        <a className="btn btn-green" href="#get">Start building</a>
      </div>
    </header>
  );
}

/* ---------- hero board illustration (pure CSS, the actual product) ---------- */

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
            npx pikaso <Arrow />
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
    </section>
  );
}

/* ---------- CTA + footer ---------- */

function Get() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText("npx pikaso").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className="get" id="get">
      <div className="get-copy" data-reveal>
        <h2>Point. Don't describe.</h2>
        <button className="cmd" onClick={copy} type="button">
          <code>npx pikaso</code>
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
        <span>
          Built for the{" "}
          <a href="https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon">
            IBM Bob 2.0 Hackathon
          </a>{" "}
          · Sept 25–27 2026 · built with Bob, on Bob
        </span>
      </div>
    </footer>
  );
}

export default function App() {
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
  }, []);

  return (
    <>
      <Nav />
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
