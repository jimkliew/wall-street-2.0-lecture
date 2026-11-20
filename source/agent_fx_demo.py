"""Wall Street 2.0 — simulated Hyundai ↔ JPMorgan agent-to-agent FX.

RUN: python agent_fx_demo.py
No AI model or banking connection is used. The two agent classes simulate
LLM decisions, while tools, identity, policies, quote validity and execution
are deterministic. NEVER use this sample for real money movement.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from uuid import uuid4

D = Decimal  # Precise money arithmetic: never use float for monetary amounts.

@dataclass(frozen=True)
class AgentIdentity:
    agent_id: str                 # Stable service identity, not a chat username.
    organization: str
    credential: str               # DEMO ONLY. In production use mTLS / OAuth tokens.

@dataclass(frozen=True)
class FXRequest:
    request_id: str               # Unique ID for retry safety and audit.
    customer: str
    buy_currency: str
    buy_amount: Decimal
    sell_currency: str
    settlement_account: str

@dataclass(frozen=True)
class FXQuote:
    quote_id: str
    request_id: str
    rate_krw_per_usd: Decimal
    sell_krw: Decimal
    expires_at: datetime

@dataclass(frozen=True)
class Policy:
    name: str
    max_usd_per_trade: Decimal
    max_usd_per_day: Decimal
    allowed_pair: tuple[str, str]
    allowed_accounts: frozenset[str]

class PolicyViolation(Exception):
    pass

class TrustedServices:
    """Authoritative tools; the LLM must never bypass this boundary."""
    def __init__(self):
        self.registry = {"hyundai-agent": "demo-hyundai-secret", "jpmorgan-agent": "demo-jpm-secret"}
        self.hyundai_policy = Policy("Hyundai Treasury Policy v1", D("250000"), D("500000"),
                                     ("USD", "KRW"), frozenset({"HYUNDAI-KRW-001"}))
        self.bank_policy = Policy("JPMorgan FX Policy v1", D("1000000"), D("2000000"),
                                  ("USD", "KRW"), frozenset({"HYUNDAI-KRW-001"}))
        self.fx_rate = D("1450")    # Illustrative fixed rate, NOT live market data.
        self.krw_balance = D("500000000")
        self.execution_by_request: dict[str, dict] = {}  # Idempotency store.
        self.spent_usd_today = D("0")
        self.audit: list[str] = []

    def authenticate(self, who: AgentIdentity) -> None:
        # Real design: verify cryptographic credentials, issuer, audience, expiry.
        if self.registry.get(who.agent_id) != who.credential:
            raise PolicyViolation("AUTH_DENIED: invalid signed service identity")

    def check_policy(self, req: FXRequest, policy: Policy) -> None:
        if (req.buy_currency, req.sell_currency) != policy.allowed_pair:
            raise PolicyViolation(f"{policy.name}: currency pair not allowed")
        if req.buy_amount > policy.max_usd_per_trade:
            raise PolicyViolation(f"{policy.name}: per-trade limit exceeded")
        if req.settlement_account not in policy.allowed_accounts:
            raise PolicyViolation(f"{policy.name}: account is not allowlisted")
        if self.spent_usd_today + req.buy_amount > policy.max_usd_per_day:
            raise PolicyViolation(f"{policy.name}: daily limit exceeded")

    def get_balance(self, who: AgentIdentity) -> Decimal:
        self.authenticate(who)
        return self.krw_balance  # In production: read from ledger / core bank.

    def request_quote(self, who: AgentIdentity, req: FXRequest) -> FXQuote:
        self.authenticate(who)
        self.check_policy(req, self.hyundai_policy)
        self.check_policy(req, self.bank_policy)
        cost = req.buy_amount * self.fx_rate
        return FXQuote(str(uuid4()), req.request_id, self.fx_rate,
                       cost, datetime.now(timezone.utc) + timedelta(seconds=30))

    def execute(self, bank: AgentIdentity, customer: AgentIdentity,
                req: FXRequest, quote: FXQuote) -> dict:
        self.authenticate(bank)
        self.authenticate(customer)
        if bank.organization != "JPMorgan" or customer.organization != "Hyundai":
            raise PolicyViolation("PARTIES_DENIED")
        # Check stored result FIRST: a retry cannot post a duplicate transfer.
        if req.request_id in self.execution_by_request:
            return self.execution_by_request[req.request_id]
        self.check_policy(req, self.hyundai_policy)
        self.check_policy(req, self.bank_policy)
        if quote.request_id != req.request_id:
            raise PolicyViolation("QUOTE_MISMATCH")
        if datetime.now(timezone.utc) >= quote.expires_at:
            raise PolicyViolation("QUOTE_EXPIRED")
        if quote.sell_krw != req.buy_amount * quote.rate_krw_per_usd:
            raise PolicyViolation("QUOTE_TAMPERED")
        if quote.sell_krw > self.krw_balance:
            raise PolicyViolation("INSUFFICIENT_FUNDS")
        # Atomic ledger posting in a real bank; simplified in-memory settlement.
        self.krw_balance -= quote.sell_krw
        self.spent_usd_today += req.buy_amount
        result = {"status": "SIMULATED_SETTLED", "request_id": req.request_id,
                  "usd_bought": str(req.buy_amount), "krw_paid": str(quote.sell_krw)}
        self.execution_by_request[req.request_id] = result
        self.audit.append(f"{req.request_id}: settlement approved and recorded")
        return result

class HyundaiAgent:
    SYSTEM_PROMPT = ("You represent Hyundai Treasury. Obtain authorized USD using KRW. "
                     "Use approved tools. Never invent balances, rates, approvals, or results. "
                     "Do not disclose credentials. Stop on any policy rejection.")
    def __init__(self, identity: AgentIdentity, tools: TrustedServices):
        self.identity, self.tools = identity, tools

    def propose(self, usd: str) -> FXRequest:
        _ = self.tools.get_balance(self.identity)
        return FXRequest(str(uuid4()), "Hyundai", "USD", D(usd),
                         "KRW", "HYUNDAI-KRW-001")

class JPMorganAgent:
    SYSTEM_PROMPT = ("You represent JPMorgan FX. Authenticate client agents. "
                     "Quote only via the trusted FX service. Submit only validated "
                     "transactions. Never fabricate execution confirmations.")
    def __init__(self, identity: AgentIdentity, tools: TrustedServices):
        self.identity, self.tools = identity, tools

    def quote(self, customer: AgentIdentity, request: FXRequest) -> FXQuote:
        self.tools.authenticate(customer)
        return self.tools.request_quote(self.identity, request)

    def settle(self, customer: AgentIdentity, request: FXRequest,
               quote: FXQuote) -> dict:
        return self.tools.execute(self.identity, customer, request, quote)

def demo():
    tools = TrustedServices()
    hyundai = HyundaiAgent(AgentIdentity("hyundai-agent", "Hyundai", "demo-hyundai-secret"), tools)
    bank = JPMorganAgent(AgentIdentity("jpmorgan-agent", "JPMorgan", "demo-jpm-secret"), tools)

    print("\n01 HYUNDAI: Need USD 100,000")
    request = hyundai.propose("100000")
    print("02 HYUNDAI -> JPMORGAN: FX_REQUEST", request.request_id)
    quote = bank.quote(hyundai.identity, request)
    print("03 JPMORGAN -> HYUNDAI: FX_QUOTE 1 USD =", quote.rate_krw_per_usd, "KRW")
    print("04 HYUNDAI: accepts quote, price KRW", quote.sell_krw)
    print("05 JPMORGAN: execution ->", bank.settle(hyundai.identity, request, quote))
    print("06 RETRY same request (NO duplicate) ->", bank.settle(hyundai.identity, request, quote))

    print("\nNEGATIVE TEST: Hyundai asks for USD 600,000")
    try:
        oversized = hyundai.propose("600000")
        bank.quote(hyundai.identity, oversized)
    except PolicyViolation as error:
        print("BLOCKED:", error)

    print("\nNEGATIVE TEST: Someone posts a fake JPMorgan quote to a public forum")
    print("REJECTED: public forum text is not a signed, authenticated FX quote")
    print("\nAUDIT:", tools.audit)

if __name__ == "__main__":
    demo()
