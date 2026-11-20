# Wall Street 2.0 — Hyundai / JPMorgan FX teaching lab

## Purpose
This browser-only application faithfully displays all 30 rendered slides from the
updated PowerPoint, then allows learners to execute a fictional USD/KRW example.
It illustrates the policies and trust boundaries explained in the presentation.

## Critical distinction
The November 2026 CNBC article reported a simulated FX transaction involving
Hyundai Card and JPMorgan, for euro liquidity in a Kinexys account. This website's
USD/KRW rate and amounts are fictional and do NOT represent that reported pilot.

## Transaction
1. Hyundai agent proposes buying USD 100,000, selling KRW.
2. Hyundai reads its KRW balance from a trusted service.
3. Hyundai sends a structured request to JPMorgan's authenticated endpoint.
4. JPMorgan verifies identity, and both policy services approve the request.
5. JPMorgan issues a time-bound quote at an illustrative 1,450 KRW per USD.
6. Hyundai accepts the quote identified by quote_id.
7. A trusted execution service checks the policies again and settles in memory.
8. An audit receipt is returned; a retry with the same request ID does not pay twice.

## Distinct roles
- AI agents: plan, decide and request authorized actions, not directly edit balances.
- Trusted tools: check identity, read balance, issue quotes, enforce both policies,
  validate quote expiry and record settlement.
- Policy owners: define authorized pairs, amount limits, accounts and approval rules.

## Demo policies
- Hyundai: max USD 250,000 per trade; USD 500,000 per day; USD/KRW only;
  allowlisted account HYUNDAI-KRW-001.
- JPMorgan: max USD 1,000,000 per trade; USD 2,000,000 per day; same pair/account.
- Both must approve; the bank-tightened scenario deliberately models a different
  hypothetical bank policy for testing independent veto power.

## Failure drills
- Chat only: no trusted tools, so no ledger posting.
- Too large: Hyundai per-trade limit rejects USD 600,000.
- Wrong destination: account outside allowlist rejected.
- Reddit-like public board: fake quote rejected; no service identity.
- Expired quote: no settlement on stale pricing.
- Duplicate request: idempotency returns the original receipt.
- Tightened bank policy: independent JPMorgan rejection despite Hyundai approval.

## Technical implementation
- index.html: presentation and interactive navigation.
- styles.css: corporate-themed layout with dark navy syntax-highlighting panels.
- simulator.js: in-browser deterministic FX simulator; no external network traffic.
- app.js: controls and syntax-highlighting source viewer.
- source/agent_fx_demo.py: downloadable, runnable Python demonstration.
- Wall_Street_2_Agentic_FX_Classroom_Edition.pptx (repo root): the PowerPoint deck.
- assets/slide-1.png through slide-30.png: rendered original PowerPoint slides.

## Production security caveats
This simulator uses in-memory balances and fixed prices. It does not include actual
LLM calls, bank integrations, authorization tokens, blockchain, regulatory compliance,
atomic durable database transactions, real authentication, sanctions/AML screening,
KYC, FX market access, treasury approvals or reconciliations. Production systems
need those controls, monitoring, human escalation and emergency revocation.

## Run
Open index.html directly in a modern browser. No build step, dependencies or server
are necessary. To run the independent Python demonstration:

    python source/agent_fx_demo.py

## Additional failure-case teaching slides (classroom edition)
- Quote tampering, stale FX prices, quote/request mismatch, and untrusted rates.
- Split-trade evasion, beneficiary substitution, compromised credentials, and prompt injection.
- Retry/double debit, executed-versus-settled status, race conditions, and cascading loops.
- Deterministic policy example and student exercises.

The JavaScript lab includes interactive extra cases for quote tampering, split-trade
evasion, injection, and pending settlement. Other cases are explained in the
PowerPoint; the simplified lab is not a complete security-test harness.
