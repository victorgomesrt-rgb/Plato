# operations.md: Running the Service

Plato is software plus a done-for-you service. The software is built once. The service runs every week. This file is how the work gets done the same way every time, so quality holds and you can hand parts to a shooter or assistant without losing the standard.

## 1. The service in one line
You find the restaurant, capture the food, build the menu, place the hardware, publish, and support. The owner only does quick edits.

## 2. Capture visit
Goal: everything needed for a live menu in one visit.

Before the visit:
- Confirm the plan and what it includes.
- Generate the capture checklist from the agreed item list.
- Charge your phone, clear storage, pack a small tripod, a clip light, and a clean backdrop card.

On site, collect:
- A short video and a photo of each dish, to the video standard in design.md. Vertical, 4 to 8 seconds, 30 fps, no audio, loopable, one simple motion.
- Prices, descriptions, and any options per item.
- Hours, location pin, phone, WhatsApp, website, socials, reserve or order links, wifi if they want it.
- Which action buttons they want, and the brand color or logo if they have one.

After the visit:
- Back up the footage the same day.
- Update the checklist so nothing is missing before you start the build.

## 3. Build the menu
- Create the client in admin if not done. Send the invite link. Never set a plaintext password.
- Bulk upload the shoot, or use menu import from a photo to draft items, then correct.
- Enter prices in the base currency. Set the USD and AWG toggle and the rate, default 1.80.
- Enter English, auto-translate to a Spanish draft, then review and fix. Keep dish names as they are.
- Pick the template. Grid is the default.
- Quality check on a real phone. Check load speed, autoplay, the action buttons, and the open-now state.
- Publish from admin. The page goes live only when published.

## 4. Hardware and placement
- Generate the QR codes in admin. Use tenant tracked links so scans are counted.
- For Starter, place one QR stand. For Growth and up, add stickers and a window decal.
- Print the branded sheet or order from the local print shop.
- Log each placement as a short link, table, window, or host stand, so analytics show where scans come from.

## 5. Tablets, if rented
- Set the device to kiosk mode locked to the menu page.
- Record the device, the customer, the term, and the deposit in the tablets table.
- On cancellation, collect the device, factory reset, and mark it for redeploy.

## 6. Billing run
- Once a month, draft invoices in admin and send by Resend.
- Mark each invoice paid when the money arrives, which activates or keeps the tenant active.
- Chase unpaid invoices on a set schedule. Decide the exact days before you suspend a page and stick to it.
- Card via Stripe is optional now. Add Sentoo once the Aruba Bank account is open. The plan and status model does not change.

## 7. Support
- Owners send change requests from the dashboard. They land in the admin Requests queue.
- Set a simple promise: standard changes within two business days, Premium gets priority.
- Common quick edits the owner does themselves: sold out, price, today's special.

## 8. Re-shoots
- Starter pays per shoot. Growth gets one re-shoot a year. Premium gets a quarterly re-shoot.
- The system reminds you when one is due. Schedule it like a fresh capture visit.

## 9. Offboarding
- On cancellation, set the page to unpublished after the paid period ends.
- Offer the owner an export of their menu content.
- Collect any rented tablet and hardware as set in the agreement.
- Keep the data per the retention you state in the privacy policy, then remove it.

## 10. Capacity planning
- Your time is the binding constraint, not the software, because capture is in every plan.
- Track two numbers: hours per capture and build, and how many live menus you can hold per week.
- When capture fills your week, hire a part-time shooter and hand them the capture visit and this runbook. Keep the build and publish steps until quality is proven.
- Watch Starter margin. A $99 plan with a full shoot is thin. Use a short minimum term or a higher setup fee if utilization runs low.

## 11. Plato Card (Apple Wallet loyalty)

A single shared "Plato Card" pass (PassBuddy) that diners add to Apple Wallet from any partner menu (the action bar's Plato Card button → `/card`) or from `/card` directly. No diner login. The member perk is a standing discount the restaurant sets in their dashboard.

Run it from admin → Plato Card:
- Onboard a partner: the owner sets their member discount + "listed" toggle in their dashboard (or you set it). Listed partners appear on `/card` and get the action-bar button.
- Promo blasts: a restaurant requests a promo from their dashboard → it lands in the admin Promo-requests queue → you review and **Approve & send** (pushes to every member, raises a $75 invoice automatically) or **Decline**.
- Network blasts: you can author and send (or schedule) a "this week on Plato" push to all members. Cap is 7 admin network blasts/week to avoid fatigue.
- Members metric = tracked "Add to Apple Wallet" taps (cookieless, no PII).

Keys + assets: `PASSBUDDY_USER_ID` / `PASSBUDDY_API_KEY` live in env (server only; also set in Vercel). The pass logo/strip are hosted on platodigital.io (`/brand/plato-pass-icon.png`, `/brand/plato-pass-strip.png`). Pass content (name, colors, fields) is editable via the API and can be refreshed any time. Apple Wallet only for now.
