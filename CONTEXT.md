# IBM Bob 2.0 Hackathon — Context

> Source: [lablab.ai event page](https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon) + [official IBM guide](https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html) (both read 2026-09-27).

## ⏰ Clock (critical)

- Event: Fri–Sun, **Sept 25–27, 2026**, fully online (lablab.ai + Discord).
- **Submissions close: Sept 27, 2026, 11:00 AM ET = 8:30 PM IST = 15:00 UTC.**
- Registration closed Sept 24, 10:00 PM CEST (no new participants after that).
- ~15,700 participants registered; ~180 projects already submitted.

## 🏆 Prizes

| Place | Prize |
|---|---|
| 1st | $5,000 |
| 2nd | $3,000 |
| 3rd | $2,000 |

Plus 20 × $100 participant rewards for: (1) a qualified submission by the deadline, (2) completing the post-hackathon feedback form. Submissions must be original and MIT-compliant. Prize payout can take up to 90 days.

## 🎯 The Challenge — "Build with purpose using IBM Bob 2.0"

Create a solution that **improves a specific developer workflow**: onboarding, debugging, code review, testing, application maintenance, or release/deployment.

Requirements of the statement:
1. Clearly define a problem where **time, effort, or errors are too high today**.
2. Using IBM Bob 2.0, build a **working prototype on a real or sample project** demonstrating a full solution for that workflow.
3. Leverage Bob's agentic features: **Agent mode, parallel tasks, subagents, document understanding** — manage multiple steps, don't just assist with coding.
4. Demonstrate measurable impact: productivity up, manual effort/errors/rework down, or task time significantly shortened.

## 🛠️ Technology

- **IBM Bob 2.0** — AI-powered dev partner (IDE) with full-repository context. Required core: the solution **must showcase Bob IDE as a core component** to be judged. Any other framework/tech is allowed alongside it.
- **Bob IDE is required**; Bob Shell (CLI), watsonx Orchestrate (agent orchestration), and watsonx.ai (Granite models, Prompt Lab, inference) are optional additions.
- Hackathon-provisioned account: **Enterprise plan**, instance named `ibm-coding-challenge-uat` (region: us-east). Sign in with hackathon registration email (IBMid required).
- **Bobcoins:** 40 per participant applied at start; no refills at 100%. Budget carefully; divide work across teammates to pool coins. Past 100%, continue with optional watsonx tools.
- Bob IDE version: **v2.0.2+ required** (v1.0.3 and v2.0.0 stop working Sept 30, 2026).
- Bob features to lean on: modes + custom modes, subagents, auto-approve config, custom rules, MCP servers, `.bobignore`, @-context mentions, Bob tips, rollback, code actions, code reviews, commit messages, PR generation, enhance-prompt, literate coding, skills, `/init` (generates AGENTS.md).
- Hands-on exercise apps from the guide: Node.js Express + Docker quickstart, Galaxium Travels demo, Node 16→22 modernization, OWASP ASVS audit skill (SARIF/OSCAL reports), watsonx Orchestrate agent building.

## 📦 Deliverables (all via lablab.ai platform)

**📋 Basic info:** Project title · short description · long description · Bob Usage Statement · tech/category tags.

**💻 Application & code:**
- **Public** code repository (must include the code/files where Bob assisted).
- **`bob_sessions/` folder** in the repo with **Bob task session summary screenshots from EACH team member** (Tasks → task header → consumption summary; PNG preferred; filename like `teamalpha_task01_login_flow_summary.png`).
- Demo application platform + application URL.

**📸 Media:** Cover image · video demo · slide presentation.

**Hard requirements:**
- Problem & Solution Statement (long description): **≤ 500 words**.
- IBM Bob Usage Statement: **≤ 500 words**.
- Video: **≤ 3 minutes**, with **≥ 90 seconds showing the solution in action**, narration included, clearly showing how IBM Bob was used.
- Repo publicly accessible.

## ⚖️ Judging Criteria

1. **Application of Technology** — completeness, well thought-out, clear application of Bob 2.0.
2. **Presentation** — clarity and effectiveness.
3. **Business Value** — impact and practical value on a high-priority issue.
4. **Originality** — uniqueness/creativity of the solution and the Bob 2.0 application.

## 🚫 Data rules (bring your own data)

- No company-confidential or client data; no personal information (PI); no social-media-sourced data.
- Public website data OK if terms allow commercial use — keep a list of sources.
- Participants own compliance responsibility.

## 📅 Event schedule (all times IST)

- Sep 25, 8:30 PM — Kick-off; 8:35 lablab.ai opening (Pawel Czech, NativelyAI); 8:40 IBM opening (Summer Hassan, IBM PM); 8:45 challenge intro; 9:05 hackathon guide; 9:30 Discord Q&A.
- Sep 27, 8:30 PM — **End of submissions**.

## 👥 Speakers / judges (partial)

Summer Hassan (IBM PM), Andrea Marazzi (NativelyAI CEO), plus judges from Walmart, DoorDash, Zocdoc, Intuit, Uber, PayPal, AmEx, Palo Alto Networks, Amazon Ads, Prudential, AWS/Meta, McKinsey. Mentor help via [lablab.ai Discord](https://discord.gg/lablabai).

## 🔎 Competitive landscape (~180 submissions already in)

Densest categories (avoid being derivative): AI code reviewers/PR analyzers, repo onboarding assistants, release-readiness guards, legacy modernizers (COBOL/PHP), CI-failure triage, drift detectors, "proof/evidence layer for AI-generated code" (many: NoGuess, Proofline, HUNT, CacheProof, Countersign…), SRE self-healing swarms.

Standout / less-crowded angles seen: ESP32 firmware verification (PinPilot), AI CAD with geometric proof (ShapeProof), cultural localization for developers (TransCreate), accessibility review with proven fixes (CurbCut), medication adherence, payment-failure recovery.

## 🔗 Key links

- Event page: https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon
- Official guide: https://lablab-ibm-bob-2-hackathon-guide.s3.us.cloud-object-storage.appdomain.cloud/index.html
- Guide — set up Bob account: …/index.html#set-up-ibm-bob-account
- Guide — example use cases: …/index.html#appendix-example-use-cases
- Bob product: https://bob.ibm.com/
- Discord: https://discord.gg/lablabai
- Submission guidelines: https://lablab.ai/ai-articles/hackathon-guidelines
- Prize terms: https://lablab.ai/terms-of-use#16-participation-terms
