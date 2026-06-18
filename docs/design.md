# design.md: Design System, Screens, UX, Empty States

## 1. Design principles
- Mobile first. The diner is on a phone, often outdoors, often on slow data.
- Food is the hero. Photos and video fill the screen. Chrome stays minimal.
- One tap to value. Scan, see food, decide, get directions or call.
- Warm and Caribbean, but clean. Not cluttered, not loud.
- Speed is a feature. Every choice serves load time.

## 1a. Logo and brand mark

The mark is a letter P whose counter holds a play triangle. It says the brand and the product in one shape: a menu in motion. This is the single strongest visual asset, so use it with discipline.

Source artwork is in the `brand` folder:
- `plato-logo.png`, the full sheet with every variant.
- `plato-lockup.png`, the horizontal lockup, mark plus the Plato wordmark.
- `plato-mark.png`, the mark alone.
- `plato-appicon.png`, the rounded-square app icon.
- `plato-mark-reversed.png`, the mark in white for dark backgrounds.

Wordmark: Plato, set in a rounded geometric sans, lowercase except the capital P, matching the soft terminals of the mark.

Colors confirmed by the logo:
- Plato Orange `#FB6A1A`. The play triangle and the primary accent. A subtle gradient toward a deeper `#E2540F` is fine on large fills.
- Ink `#16110E`, near black, for the P body and dark surfaces.
- White for reversed use.

Usage:
- On light backgrounds use the dark mark. On dark or photo backgrounds use the reversed mark. On orange use the white mark.
- Keep clear space around the mark of at least the height of the play triangle.
- Minimum size: the mark stays legible down to 24px, the lockup down to about 96px wide.
- The app icon is the mark on a rounded square. Use it for the tab favicon, the home-screen icon, and the small chip in the dashboard and admin.

Do not:
- Recolor the mark outside the brand palette.
- Stretch, rotate, or add effects.
- Place the dark mark on a busy photo without the reversed version or a scrim.

## 2. Brand and tokens

Default theme. Each tenant overrides the accent and their own restaurant logo.

- Accent: Plato Orange `#FB6A1A`, taken from the logo. Evokes sun and appetite.
- Accent deep: `#E2540F` for hover and pressed states.
- Ink: `#16110E`. Surface: `#FFFFFF`. Muted: `#6B6660`. Line: `#ECE7E1`.
- Sea `#0E5B5B` and citrus `#F4B740` are secondary accents for the Caribbean note.
- Tenant accent is configurable. Used for buttons, active tabs, price chips.
- Type: Bricolage Grotesque for display, Inter for UI and data.
- Radius: 16px on cards, 12px on buttons, full on chips.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Shadows: soft and low. Cards lift only slightly.
- Motion: short, 150 to 250ms ease. Video loops are the only constant motion.

Build all of this as Tailwind tokens and shadcn theme variables so a tenant accent swaps cleanly.

## 3. The diner page (public)

This is the product the world sees. Get it right above all else.

Layout top to bottom:
1. Cover media. Full width photo or short looping video. Logo overlaid. Restaurant name.
2. Action bar. A row of icon buttons the owner configures. See section "Action bar" below.
3. Language toggle. EN and ES at launch, shown only for active locales. Small, top right.
4. Currency toggle. USD and AWG, shown when the tenant turns it on. Sits beside the language toggle. The active currency is always clear so a diner knows what they will pay.
5. Featured band. A Most Popular row near the top, above the categories. See below.
6. Category nav. Sticky horizontal scroll chips. Tap to jump.
7. Menu sections. Each item is a card.

Featured band:
- A horizontal scroll row of the standout dishes, titled Most Popular by default, with a title the tenant can change.
- Each featured card shows the looping video or photo, the name, and the price. Tap opens the full item.
- Driven by an `is_featured` flag on items, ordered by a featured rank the team sets by drag. This is separate from the popular tag chip, though the two often go together.
- If no items are marked featured, the band hides. It never shows empty.
- It works in every template. In Reel, the featured dishes lead the feed. In Grid, Classic, and Spotlight, it sits as a row at the top.
- Keep it tight, three to eight dishes, so it stays a highlight and not a second menu.

Item card:
- Looping muted video or image, 4 by 5 or square.
- Name, short description, price chip.
- Tags as small chips: popular, new, spicy, vegan.
- Tap to open a full screen view with larger video, full description, and any options.

Footer:
- Address with a map preview.
- Hours, today highlighted.
- Powered by Plato link. Small. This drives inbound leads from other owners.

Behavior:
- Posters load first. Video plays muted on scroll into view. Pauses off view.
- Sticky mini header appears on scroll with name and a directions button.
- No login, no popups, no cookie wall beyond what law requires.

## 3a. Menu templates

Offer four layouts. The owner picks one in Page settings. All four read the same data, so only the item presentation changes. This keeps the build cheap and lets you add more later. Build Grid first as the default, then the others as fast-follow.

1. Reel. Full screen vertical video cards, one dish at a time, swipe up to the next. Feels like TikTok. Best for video-first venues and younger diners. The strongest differentiator.
2. Grid. Two-column cards with looping video or image, name, and price. Scannable, holds many items. Safe default for most restaurants and cafes.
3. Classic. Single-column elegant list with a small thumbnail, name, price, and description. Familiar and calm. Good for fine dining and wine-forward spots.
4. Spotlight. Magazine layout with one large hero item per category and smaller items below. Editorial feel. Good for beach clubs and upscale venues.

Shared shell across all templates: cover header, action bar, language and currency toggles, the featured band, category nav, footer. Theme tokens layer on top, so the accent color and a font pairing adjust per tenant.

Plan tie-in option: make Reel and Spotlight available on Growth and Premium as an upsell, with Grid and Classic on all plans. Decide later. Do not gate the first build.

## 3b. Action bar

A configurable row of icon buttons at the top of the menu page. The owner turns each on or off, sets the target, and orders them. Stored in `tenants.links`.

Supported buttons:
- Directions. Opens Google or Apple Maps to the saved pin. Uses lat and lng.
- Call. Opens the phone dialer.
- WhatsApp. Opens a chat to the saved number.
- Website. Opens the restaurant's own site.
- Reserve. Links to their reservation tool or a WhatsApp booking.
- Order. Links to their online ordering or a delivery platform.
- Email or Contact. Opens a prefilled email or a simple contact action.
- Instagram, TikTok, Facebook. Opens the profile.
- Reviews. Links to Google or Tripadvisor.
- Menu PDF. Downloads a printable menu for those who want it.
- Wifi. Shows the wifi name and password. Tourists love this.
- Share. Shares the page link.

Map pin in the editor: give the owner a small map with a draggable pin to set lat and lng. Do not make them type coordinates. The Directions button and the footer map both use this pin.

Behavior: show only enabled buttons. If the owner enables more than fit one row, wrap or scroll. Keep icons clear with short labels. Every tap logs a `link_click` for analytics.



Navigation: Menu, Page, Analytics, Hardware, Billing, Settings.

### Menu editor
- List of categories, each expandable to its items.
- Drag to reorder categories and items.
- Add item modal: name, description, price, image, video, tags, availability.
- Inline availability toggle. Sold out flips a switch, hides or greys the item.
- Featured toggle. Mark an item to put it in the Most Popular band, and drag the featured items to set their order.
- Live preview button opens the public page in a new tab.

### Page settings
- Template picker. Choose Reel, Grid, Classic, or Spotlight. Live preview of each.
- Logo and cover upload.
- Accent color picker and optional font pairing.
- Description, phone, WhatsApp.
- Map pin. A small map with a draggable pin to set the location. No typing coordinates.
- Action bar editor. Toggle each button on or off, set its target, and drag to reorder.
- Opening hours editor.
- Wifi name and password, if the owner wants the Wifi button.
- Currency. Base currency, USD or AWG. A USD and AWG toggle switch for the page. The exchange rate, default 1.80, editable.
- Languages: English and Spanish at launch. Pick which are active. Inline fields per item, with an auto-translate button that fills the second language as a draft for you to review and fix before publish.
- Slug and, on paid plans, custom domain setup with DNS instructions.

### Analytics
- Cards: page views, unique sessions, QR scans, NFC taps, directions clicks, calls.
- Top dishes by views and by video plays.
- Trend line over the last 30 days.
- Date range selector.

### Hardware and requests
- Catalog of available items by plan: QR stickers, NFC stickers, table stand, window decal, flyer design.
- Request flow. Quantity, notes, submit. Status badge after.
- Change requests. For managed customers, a simple form to ask for a menu or video update. Same pattern as hardware orders. Lands in your admin queue.

### Billing
- Current plan, renewal date.
- Upgrade or downgrade. Opens Stripe portal.
- Invoices list.

### Settings
- Team members, invite by email, set role.
- Account and password.
- Danger zone: pause page, delete account.

## 5. Admin console (you only)

Navigation: Overview, Tenants, New Client, Requests, Hardware, Tablets, QR Codes, Billing, Revenue.

- Overview: MRR, active tenants, past due, churn this month, new this month.
- Tenants: searchable table. Name, plan, status, MRR, created, last edit. Row actions: view page, impersonate, suspend, activate, change plan.
- New Client: provisioning form. Restaurant name, slug with availability check, plan, owner email. Creates the tenant, the owner account, and the membership, then sends an invite or set-password link. No plaintext password is created.
- Requests: change requests and hardware orders across tenants. Update status.
- Hardware: stock and fulfillment of stickers, stands, decals, flyers.
- Tablets: the rented tablet fleet. Which device is with which customer, term, deposit, and status. Mark returned for redeploy.
- QR Codes: the QR generator. See below.
- Billing: draft and send invoices, mark paid, send reminders. See architecture billing.
- Revenue: MRR over time, plan mix, setup fees, hardware and tablet revenue.

### QR code generator
A built-in generator so you never leave the app to make a code.
- Input: paste any URL, or pick a tenant and one of its tracked links, table, window, or host stand. Picking a tenant link points the QR at the `/q` redirect so scans are counted.
- Style: modern by default. Rounded modules, the tenant accent color, a small center logo, and a clean caption like "Scan for our menu". A few style presets.
- Live preview as you type.
- Download: PNG and SVG for digital, and a print-ready PDF. Also a one-tap branded print sheet, a table card and a window decal sized and ready for the print shop.
- Bulk: generate the full set for a tenant at once, table, window, and host stand, each as its own tracked code.

## 5a. Tools that make the workflow smoother

These are the highest-leverage helpers for your capture-and-build operation. Tagged by when to build them.

- QR and print pack. The generator above, plus a one-click branded hardware kit PDF per tenant. v1 for the generator, print pack v1.1.
- Menu import from a photo. Photograph or upload the restaurant's existing paper menu. Claude vision parses it into a draft of categories, items, and prices that you correct. Cuts menu build time hard. v1.1, high value.
- Bulk media uploader. Drop all the clips and photos from a shoot, then match them to items quickly by filename or a tap. Building a 40-item menu becomes minutes. v1.
- Capture checklist. From the menu list, generate a shot list you open on your phone during the visit, checking off each dish filmed and photographed. Fewer forgotten items and re-visits. v1.
- Onboarding progress per tenant. A checklist that tracks capture done, menu built, translated, hardware placed, published, owner shown. Nothing slips. v1.
- Monthly owner email. Resend sends each owner their views, top dishes, and scans. A quiet retention lever that keeps the value visible. v1.1.
- Re-shoot reminders. Auto-remind you when a Growth yearly or Premium quarterly re-shoot is due. v1.1.
- Billing run. Draft this month's invoices in one pass, send by Resend, and chase the unpaid ones. v1.

## 5b. Owner dashboard quick actions

Keep the owner side tiny and friendly, since they only do quick edits.
- Sold out toggle on any item, one tap.
- Edit a price, one field.
- Add a special for today.
- Preview as a diner and share the link or their QR.
- Download their own QR and poster to reprint.
- Request a change, which lands in your admin Requests queue.

## 6. Onboarding flow

You provision and capture. The owner does not build their own page. Goal: a live, filmed menu within a day or two of the visit.

1. You create the client account in admin. The owner gets an invite link to set a password, or signs in by magic link.
2. On-site capture visit, guided by the capture checklist. Shoot photos and short videos of the dishes. Note prices, descriptions, hours, location pin, and the action buttons they want.
3. You build the menu from the captured content, using the bulk uploader or menu import. Pick the template, set currency and translation.
4. Generate and place hardware from the QR generator: the QR stand on Starter, plus stickers and decal on Growth and up.
5. Publish from admin. Send the owner their live link and a short guide to quick edits.
6. Show the owner the page on their phone. The first live view is the moment that sells the next customer.

For the owner, the dashboard opens to a simple home: their live page, quick edit buttons, analytics, and a change request button.

## 7. Empty states

Design each one. Empty states teach and reduce drop off.

- No menu yet, owner view: "We are building your menu from your shoot. It goes live shortly." For the team view: "Add the captured items to publish."
- No categories: "Group your menu. Start with Starters, Mains, Drinks." Quick add buttons for common categories.
- No video on an item: "Add a short clip. 6 seconds is enough. People order more when they see the food move." Button: Upload video. Offer "Use a photo for now."
- No analytics yet: "No views yet. Share your link or place your QR on tables. Data shows up here within minutes." Show the QR and a copy link button.
- No hardware ordered: "Bring diners to your menu. Order QR stickers and an NFC tap card for your tables." Catalog preview.
- Trial ending: a banner. "3 days left in your trial. Keep your menu live." Button: Choose a plan.
- Past due: a banner. "Your payment did not go through. Update your card to keep your page online." The public page still loads during a short grace window, then shows a soft notice.
- Suspended tenant public page: a clean placeholder. "This menu is not available right now." No error look. Keep brand intact.
- Search returns nothing in admin: "No tenants match. Try another name or status."
- Custom domain pending: "We are setting up your domain. This takes up to 24 hours. Your platodigital.io page works now."

## 8. Microcopy voice
- Warm, plain, confident. Short sentences.
- Speak to the owner like a helpful local partner, not a software vendor.
- Avoid jargon. Say "menu page" not "tenant site."

## 9. Accessibility
- Color contrast meets WCAG AA. Test the orange on white and on photos with an overlay.
- All actions reachable by keyboard in the dashboard.
- Video has no audio dependency. Captions not needed for silent loops.
- Tap targets at least 44px.
- Respect reduced motion. If set, show posters and pause loops.

## 10. Localization and currency
- English and Spanish at launch, the two most spoken languages on the island. Dutch and Papiamento as a fast-follow.
- Each tenant has a source language, default English. Item and category names and descriptions store both languages.
- Auto-translate fills the second language as a draft. You review and fix it before publish. Never auto-publish raw machine output. Keep dish names like Keshi Yena and Pan Bati as they are.
- The language toggle shows only active locales and persists per session.
- Currency: prices are entered in the tenant base currency. The page offers a USD and AWG toggle when turned on, converting at the fixed peg, default 1.80, and rounding for a clean look. Market-price items do not convert.

## 11. Capture and video standard
One standard keeps the whole platform looking consistent. Your team follows this on every shoot.

Format and length:
- Capture vertical, 9 by 16, 1080 by 1920. This fills the Reel template and crops cleanly to a square for Grid and Classic.
- 4 to 8 seconds per clip, made to loop with no hard cut.
- 30 fps, no audio. The loops play muted.
- Export MP4 or MOV, H.264, under about 60 MB per clip.

Framing and look:
- Dish centered, filling most of the frame, shot on a clean surface.
- One simple motion per clip: a slow push in, a pour, steam, a garnish drop, or a fork pull. Avoid busy camera moves.
- Soft, even light. Natural light near a window works well. Keep white balance consistent across a venue.
- Keep backgrounds and props consistent within a restaurant so the menu feels like one set.

Photos, for items without video:
- Same framing rules. Shoot in good light, hold the phone steady, fill the frame with the dish.
- The platform converts and optimizes on upload, so shoot at full quality.

Posters:
- Every video has a poster frame, the first clean frame or one you pick. The poster loads first and stands in while the clip is processing.
