# Privacy Policy, Plato

> ⚠️ **DRAFT, NOT LEGAL ADVICE.** This document was generated from the project's own
> specs as a starting point. It **must be reviewed and approved by a qualified attorney**
> (familiar with Aruba law and, for EU visitors, the GDPR) before it is published or
> relied upon. Replace every `[bracketed]` placeholder. See qa.md §13, legal sign-off is
> a pre-launch blocker.

**Effective date:** [DATE]
**Operated by:** Plato, a service of GMS Innovations (a sole proprietorship registered in Aruba), [address], Aruba.
**Contact:** [privacy@platodigital.io]

## 1. Who this policy is for
Plato provides hosted, mobile-first video menus for restaurants at `platodigital.io/<name>`
and on custom domains. This policy explains how we handle information for two groups:

- **Restaurant owners and their staff** ("Owners") who use our dashboard.
- **Diners** who view a restaurant's public menu. **Diners never create an account and we
  do not collect personal data from diners** (see §3).

## 2. Information we collect from Owners
- **Account data:** name, email address, and (if set) a password, managed through our
  authentication provider. Owners are provisioned by our team; we never create or store a
  plaintext password.
- **Restaurant data:** restaurant name, description, address/location pin, phone, WhatsApp,
  opening hours, links, menu content, prices, and the photos/videos we capture.
- **Billing data:** plan, invoices, payment status, and (if the card path is enabled)
  payment details handled by our payment processor, we do not store full card numbers.
- **Support data:** change requests, hardware orders, and correspondence.

## 3. Information from Diners, cookieless, no personal data
The public menu pages are **analytics-light and privacy-first**:
- **No cookies** are set for diners and **no cookie-consent wall** is shown.
- We record **anonymous, aggregated events** only (e.g. page views, item views, video
  plays, QR scans, NFC taps, and action-button clicks).
- A per-day **session identifier is a one-way hash** of coarse signals (e.g. truncated IP
  + user agent + the date). It is **not a cookie**, is not linked to any identity, and
  cannot be used to track a diner across sites or days.
- We do **not** sell data, run third-party ad/marketing trackers, or build diner profiles.

## 4. How we use information
- To provide, operate, and secure the menu pages and Owner dashboard.
- To build and publish each restaurant's menu (our done-for-you capture service).
- To send transactional email (invites, invoices, receipts, reminders, and optional
  monthly performance summaries).
- To produce aggregate analytics for Owners (views, top dishes, scans) and to bill Owners.
- To provide support and improve the service.

## 5. Service providers (sub-processors)
We share the minimum data necessary with vendors that process it on our behalf:

| Provider | Purpose |
|---|---|
| Supabase | Database, authentication, and file storage |
| Bunny.net | Video encoding and delivery (CDN) |
| Vercel | Application hosting |
| Resend | Transactional email delivery |
| Cloudflare | DNS and email routing |
| Anthropic (Claude API) | Menu text translation (EN→ES drafts) |
| [Stripe, if/when the card path is enabled] | Card payments (via GMS Innovations or an appointed payment entity) |
| [Sentoo, once added] | Local Aruba card/bank payments |

A current list of sub-processors is available on request. Data may be processed in the
United States and the European Union depending on provider region.

## 6. Cookies and similar technologies
- **Owners:** a strictly-necessary cookie maintains the dashboard login session. No
  analytics or advertising cookies are used.
- **Diners:** none (see §3).

## 7. Data retention
- **Raw analytics events** are pruned after approximately 30 days; only aggregated daily
  rollups (no personal data) are retained longer for trends.
- **Owner account and restaurant data** are retained while the account is active and for a
  reasonable period after cancellation, after which they are deleted per §9 of our service
  agreement, unless we must keep them for legal/tax reasons.

## 8. Your rights
Depending on your location, you may have rights to access, correct, delete, or export your
personal data, and to object to or restrict certain processing. To exercise these rights,
contact [privacy@platodigital.io]. EU/EEA visitors have rights under the GDPR; we do not
require a cookie-consent banner because diner analytics use no cookies and no personal data.

## 9. Security
We use industry-standard measures including encryption in transit, row-level access
controls that isolate each restaurant's data, and server-only handling of privileged keys.
No method of transmission or storage is 100% secure.

## 10. Children
The service is intended for businesses and is not directed at children under [13/16].

## 11. International transfers, changes, and contact
Plato operates from Aruba (America/Aruba time) and uses providers in multiple regions.
We may update this policy and will post the new effective date. Questions:
[privacy@platodigital.io].
