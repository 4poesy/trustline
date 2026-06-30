# LOAN_PARTNERSHIPS.md — Trustline

This is NOT a build prompt. This is a business development / strategy reference for the loan access track, which runs in parallel to product development, not inside a sprint.

## Why Trustline should not become a lender itself

Lending money requires a license (in Nigeria, oversight typically falls under the CBN — Central Bank of Nigeria — for microfinance/lending activity), real capital reserves, credit risk modeling, collections infrastructure, and regulatory compliance most software teams aren't built for. Trying to "become a bank" alongside building the core product would slow everything down and introduce serious legal/financial risk.

**The right model: Trustline is the trust/data layer. A licensed partner is the lender.**

This mirrors how companies like Carbon, FairMoney, or Branch operate in Nigeria's digital lending space, or how a credit bureau (like CRC Credit Bureau or FirstCentral) supplies data to banks without lending themselves — you supply the underwriting signal, a regulated partner takes the lending risk and does the disbursement.

## What Trustline brings to a lending partner

This is the actual pitch once you start approaching microfinance banks (MFBs), digital lenders, or fintech credit partners:

- **Verified income history** — transaction logs (Module 2) showing real, time-stamped earning activity, not self-reported income on a loan form
- **Reputation data** — review/rating history (Module 3) as a soft trust signal
- **Savings discipline** — contribution consistency in rotating savings groups (Module 4) as a strong behavioral indicator of repayment reliability
- **A pre-qualified, warm user base** — people who've already demonstrated months of consistent app usage, which is itself a signal most informal-economy lenders don't have access to today

## Two partnership models to consider

| Model | How it works | Pros | Cons |
|---|---|---|---|
| **Data/referral partnership** | Trustline shares (with user consent) a trust profile/export to a partner MFB or lender; user applies through the partner's own flow | Simplest to set up, lowest regulatory exposure for Trustline | Less seamless UX, you don't control the loan experience |
| **Embedded lending (API partnership)** | Partner's loan product is offered INSIDE the Trustline app via their API — user applies and gets funded without leaving the app | Much better UX, stronger retention, Trustline becomes the front door for credit | Requires a more sophisticated partner integration, longer to set up, possible revenue-share/commercial agreement needed |

**Recommendation: start with the data/referral model.** It proves the concept with real users and real outcomes (did people who used Trustline get approved more easily / get better rates?) before investing in a deeper embedded integration. Use early traction as leverage to negotiate a better embedded deal later.

## Who to approach (categories, not exhaustive — research current players before outreach)

- Microfinance banks already serving informal-sector customers (e.g. LAPO MFB, Accion MFB)
- Digital lending fintechs looking for better underwriting data (e.g. FairMoney, Carbon, Branch)
- Cooperative/savings-group-focused fintechs who might value the ajo/esusu data specifically
- Development finance institutions or impact investors interested in financial inclusion data partnerships (these sometimes fund pilots even before a commercial deal exists)

## What you need before approaching anyone

1. **Real usage data** — even a few hundred active users with a few months of transaction/savings history is far more convincing than a pitch deck alone
2. **A simple one-page data partnership proposal** — what Trustline provides, what a partner gets, how user consent is handled
3. **A clear answer on user consent and data sharing** — users must explicitly opt in before their trust profile is shared with any third party; this should be a toggle in the app, never default-on
4. **Basic legal review** — even a referral-only model touches data protection law (Nigeria Data Protection Act) — a short consult with a lawyer familiar with fintech/data partnerships before your first real partner conversation is worth the cost

## Sequencing relative to the product roadmap

Don't wait for "the perfect trust score" to start these conversations — start informal conversations with 1-2 potential partners as soon as Module 4 is live and you have even a small base of real users. Lending partnerships take months to close; running that track in parallel with Module 5 (and beyond) means you're not stuck waiting at the finish line.

## Explicit non-goals (for now)

- Trustline does not disburse loans directly
- Trustline does not hold or manage repayments
- Trustline does not set interest rates or loan terms — that's the licensed partner's domain entirely

See also: AGENTS.md, ARCHITECTURE.md (for how this might eventually appear as an Edge Function / data export feature once a partner is signed)
