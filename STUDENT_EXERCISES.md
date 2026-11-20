# Student exercises — agent-to-agent FX

1. **Chat ≠ payment.** Run `Chat only`. Explain which verifiable tool outputs are missing.
2. **Dual veto.** Why can JPMorgan reject USD 150,000 even if Hyundai approves it? Run `Bank tighter`.
3. **Cumulative limits.** Run `Split-trade evasion`. Why is a per-trade cap alone insufficient?
4. **Untrusted text.** Run `Public forum` and `Prompt injection`. Which components must treat this input as data?
5. **Quote binding.** Run `Quote tampering` and `Quote expires`. Which fields must be checked at execution?
6. **Idempotency.** Run `Retry / replay`. Explain why request ID + durable posting are important.
7. **Settlement states.** Run `Pending settlement`. Explain why `TRADE_EXECUTED` is not `SETTLED`.
8. **Architecture challenge.** Identify the owner of each policy (Hyundai vs JPMorgan), the authority to change it, and audit trail.

**Advanced:** Extend the Python demo with a durable SQLite idempotency ledger, separate accepted/executed/settled states, an expiring simulated token, and tests for concurrency. Explain why this still is not a production banking system.


## Decorators quiz and exercise

Open `decorator_quiz.html` and answer all five questions. Then define `@audit` to log before and after a mock FX tool call. Explain why wrapping a method is not equivalent to a bank-side authorization control.
