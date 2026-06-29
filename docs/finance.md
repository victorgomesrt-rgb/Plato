# finance.md: Pricing, Revenue, and Profit Forecast

All figures in USD. Aruba uses the florin pegged near 1.80 to the USD, and tourists pay in USD, so price and report in USD.

## 1. Pricing

Content capture is a service in every plan. You go on-site, shoot the food photos and videos, and build the menu for them. The owner gets a dashboard for quick edits. No plan is pure self-serve.

| Plan | Monthly | Annual (10x) | Setup (one time) | Key inclusions |
|---|---|---|---|---|
| Starter | $99 | $990 | $199 | Online menu page, restaurant info and action buttons, on-site photo and video capture of key items, EN and ES, USD and AWG, one QR code stand, dashboard access, basic analytics, item cap 40 |
| Growth | $249 | $2,490 | $299 | Everything in Starter, plus full video menu, more items, advanced analytics, NFC and QR sticker pack, window decal, custom domain |
| Premium | $499 | $4,990 | $499 | Everything in Growth, plus unlimited items, spot on the Discovery feature page, priority support, flyer design, quarterly re-shoot, full hardware kit |

Setup fee covers the first on-site capture session and the menu build. Price it so labor on the first visit is covered even if a Starter customer leaves early.

Add-ons, one time or recurring:
- Extra capture or re-shoot session: $150 to $400 per visit, by scope.
- Tablet display, rented. See section 5.
- Extra hardware (window decal, extra QR/NFC, table stand): at cost plus margin.
- Flyer or extra print design on lower tiers: $75 each.
- Plato Card promoted blast (Apple Wallet): $75 each, or a $199/mo "always promoting" bundle (up to 4 blasts). Premium includes 1 free blast/mo. See section 10.
- Review Card: a payment-gated QR/NFC/decal that redirects diners to the restaurant's Google review page. About $25/mo, set in the catalog. The redirect pauses the moment the card lapses. See section 11.

All add-ons are billable from the admin Billing screen. An invoice is built from **multiple line items** (each `quantity × unit price`, auto-summed to the total). Add-on prices live in an **editable service catalog** (admin Billing → **Manage services & prices**: add, rename, remove, reprice — e.g. Plato Card blast, Tablet rental, decal/hardware, re-shoot, NFC/QR pack, flyer). Subscription and Setup lines stay plan-derived (PLAN_PRICES / PLAN_SETUP, not in the catalog). Line items show itemized on the owner's invoice and PDF.

Re-shoot cadence by plan: Starter pays per re-shoot, Growth one included per year, Premium quarterly included. This protects your time.

## 2. Recurring platform costs

These stay near flat as you grow in the early stage.

| Item | Monthly |
|---|---|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Bunny Stream (video storage and delivery, early) | $30 to $60 |
| Resend email | $0 to $20 |
| Domains and misc | $10 |
| Total early stage | about $100 to $135 |

Stripe processing is about 2.9% plus $0.30 per charge. Model it as roughly 3% of subscription revenue.

Gross margin on subscriptions is high, about 88% to 92%, once the platform cost is spread over more than ten customers.

## 3. Hardware cost of goods (per customer, one time)

| Item | Your cost | Notes |
|---|---|---|
| QR sticker pack (vinyl, 10) | $4 to $6 | Local or online print |
| NFC stickers NTAG215 (5) | $8 to $12 | Tap to open URL |
| Acrylic table stand | $8 to $15 | Wholesale, reusable |
| Window decal | $8 to $12 | Storefront |
| Flyer design | your time | Canva, print is pass-through |

Blended hardware COGS per Growth or Premium customer: about $30 to $55. Premium full kit closer to $60 to $90. Cover this with the setup fee and the higher monthly.

## 3a. Tablet display: rent, do not sell

The in-store tablet is an optional add-on across plans. Recommendation: rent it, do not sell it.

Why rent beats sell here:
- You keep the asset. If a customer leaves, you reclaim the tablet and redeploy it. One device serves several customers over its life.
- Recurring revenue and stickiness. A device on their counter that you own keeps them subscribed.
- Lower barrier to yes. A small monthly fee is easier than a few hundred dollars upfront.
- You control it. Lock it to kiosk mode showing only their menu. It looks professional and cannot be misused.

Suggested numbers:
- Device cost: about $200 to $330 for an entry iPad, less for a refurbished unit or a good Android tablet.
- Rent at $35 per month as an add-on.
- Payback: at $35 per month a $300 device pays back in about 9 months. After that it is margin, or you redeploy it.
- A simple floor stand or counter mount: $20 to $50, one time, reusable.

Safeguards:
- A small refundable deposit, or a damage and loss clause in the agreement.
- A minimum term of 6 to 12 months so you recover the device cost.
- Kiosk lockdown with Guided Access on iPad or a kiosk app, pinned to the menu URL.
- Start with one or two units to test demand before buying a batch. Do not tie capital up early.

Do not bundle a tablet into Premium by default. It is capital intensive. Offer it as an opt-in rental on any plan.

## 4. Market size, Aruba

- Tourist dining spend in Aruba in 2025: USD 204.4 million.
- Stayover visitors per year: about 1.4 million, growing near 10% per year.
- Serviceable target: tourist-facing restaurants, cafes, bars, food trucks, beach clubs. Conservative count of strong prospects: 150 to 250 in the main zones of Palm Beach, Eagle Beach, Oranjestad, Noord, and San Nicolas.

Even at 40 customers you hold a meaningful share of the premium segment and a tiny fraction of the total dining economy. Room to grow is large.

## 5. Revenue forecast, Year 1 (conservative)

Assumptions:
- Build in months 1 and 2. First paying customers in month 3.
- Plan mix: 40% Starter, 45% Growth, 15% Premium.
- Blended monthly price: 0.40 x 99 + 0.45 x 249 + 0.15 x 499 = about $226.
- Average setup fee collected: about $250 per customer.
- Low churn in year 1 given novelty and local relationships. Model 2% monthly.

| Month | Active customers | MRR | Setup fees that month | Notes |
|---|---|---|---|---|
| 1 | 0 | $0 | $0 | Build |
| 2 | 1 (free pilot) | $0 | $0 | Flagship filmed |
| 3 | 3 | $678 | $750 | First paying |
| 4 | 6 | $1,356 | $750 | |
| 5 | 9 | $2,034 | $750 | |
| 6 | 13 | $2,938 | $1,000 | |
| 7 | 17 | $3,842 | $1,000 | |
| 8 | 21 | $4,746 | $1,000 | |
| 9 | 25 | $5,650 | $1,000 | |
| 10 | 29 | $6,554 | $1,000 | |
| 11 | 33 | $7,458 | $1,000 | |
| 12 | 38 | $8,588 | $1,250 | |

Year 1 outcomes:
- Exit MRR: about $8,600. Exit ARR run rate: about $103,000.
- Subscription revenue collected across the year: about $44,000.
- Setup fees collected: about $9,500.
- Total Year 1 gross revenue: about $53,000 to $56,000 including small hardware margin.

Year 1 costs:
- Platform infra: about $1,400.
- Hardware COGS: about 30 paid customers x $45 = about $1,400.
- Stripe processing: about 3% of $44,000 = about $1,300.
- Print and misc: about $1,000.
- Total cash costs before your labor: about $5,100.

Year 1 contribution before your time: about $48,000 to $50,000.
This is a one person operation in year 1. The cost is mostly your selling and filming time.

## 6. Revenue forecast, Year 2 (two scenarios)

Conservative, deeper Aruba penetration only:
- Reach 90 active customers by month 24.
- MRR about $20,300. ARR run rate about $244,000.
- Year 2 subscription revenue collected: about $170,000 to $190,000.

Optimistic, Aruba plus one more island (Curacao or Bonaire) and a small filming team:
- Reach 140 active customers by month 24.
- MRR about $31,600. ARR run rate about $380,000.
- Year 2 subscription revenue collected: about $250,000 to $290,000.

Margins hold high on subscription. The main new cost in the optimistic case is a part-time filmer or editor and travel for the second island.

## 7. Unit economics

Per Growth customer ($249/mo):
- Gross margin after infra share and processing: about $215 to $225 per month.
- One time setup of $250 roughly covers first hardware and onboarding time.
- If a customer stays 18 months, lifetime gross contribution is about $4,100 plus setup.
- Acquisition cost is mostly your time. If you later pay a referral of one month, payback is fast.

## 8. Levers that raise profit
- Push annual plans. Cash up front, lower churn.
- Sell the filming service as a recurring quarterly refresh.
- Bundle hardware into setup so it is margin, not a giveaway.
- Add the Discovery directory and charge for featured placement once traffic is real.
- Sell Plato Card promoted blasts ($75 each / $199-mo bundle). Near-100% margin, and it makes Plato the owner of the diner audience. See section 10.
- License the platform to operators on other islands rather than running every island yourself.

## 9. What to track weekly
- New trials, trial to paid conversion, active customers, MRR, churn, setup revenue, hardware revenue, video delivery cost. Build these into the admin Overview.

## 10. Plato Card — Apple Wallet loyalty (new revenue line)

A Plato-branded Apple Wallet card diners add once (anonymous, no login). The perk is a member discount at partnered restaurants; only the admin pushes notifications. It is both a retention/re-engagement channel Plato owns and a paid marketing product sold back to restaurants.

Pricing:
- $75 per promoted blast (a one-time push to every Plato member).
- $199/mo "always promoting" bundle, up to 4 blasts/mo (~$50 each).
- Premium plan includes 1 free blast/mo (an upgrade driver).

Cost + margin:
- Built on PassBuddy. Wallet push has ~$0 marginal cost, so price on value, not cost.
- Plan: free tier (1 pass + 15,000 notifications/mo) covers the launch period; PassBuddy Pro (3 passes + 150,000 notifications/mo) only needed once the member base × send volume grows. The notification budget, not delivery cost, is the constraint.
- Comparable channels: SMS marketing ≈ $40 per 1,000 messages; a blast to a 3,000-member base would cost ~$90–150 via SMS. Wallet blasts are cheaper to send and higher-visibility (lock screen).
- Effective margin per blast is near 100% until the Pro tier is needed; even then, 150k notifications/mo covers ~50 blasts to a 3k base, so per-blast cost stays trivial.

Operational: restaurants request a blast from their dashboard; the admin reviews, sends, and the invoice is raised automatically ($75 line). Network blasts (Plato's own "this week on Plato") are admin-authored and capped at 7/week to protect the diner experience. Apple Wallet only for now (Android is a later phase).

## 11. Review Card (reputation add-on)

A payment-gated QR/NFC/decal that sends diners straight to the restaurant's Google review page. The code routes through `platodigital.io/r/<code>`, so Plato controls the destination: while the card is active and paid through the current period it redirects to Google, otherwise it shows a neutral paused page. No reprint to switch it on or off.

Pricing: about $25/mo (editable in the billing catalog). Near-zero marginal cost (it is just a redirect), so it is high-margin and an easy upsell on top of any plan, or a low-friction entry product for restaurants not yet on a menu plan (a standalone version is a later phase).

Compliance: we link every diner to the restaurant's public Google review page. This is payment-gating, not sentiment-based "review gating" (which Google prohibits), so we are clear.

Operational: set it up in admin → tenant → Review Card (paste the Google URL, toggle active, set paid-through, generate the code). "Bill 1 month" raises a draft invoice; marking it paid extends access a month. To cut a non-payer, toggle active off or let paid-through lapse.
