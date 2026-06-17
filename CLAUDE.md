# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketing/lead-generation website for **Dakrenovatie Midden-Nederland**, a Dutch roofing company. All site content is in **Dutch**, keep copy, labels, form fields, and alt text in Dutch.

Built as a custom **Astro + Tailwind CSS** site. The `example_page/` screenshots (an existing WordPress + Colibri site at dakrenovatiemiddennederland.nl) are the **look-and-feel reference** for the new design, match its layout, sections, and style.

**Scope right now: front-end only.** Build the pages and components; the quote form submits via **email** for now (see Interactive pieces). Hosting is not decided yet, avoid host-specific config (no Netlify/Vercel adapters or platform functions) until the user picks a host, so the build stays portable.

> **Status:** the Astro + Tailwind site is scaffolded and built (pages, components, quote/review forms). Ongoing work is refinement against the reference, not initial setup.

## Assets (reference material, not shipped as-is)

- `example_page/`, ~31 mobile screenshots of the reference site. **This is the design/layout source of truth**, match its layout, sections, copy, and order. Screenshots are sequential top-to-bottom of the homepage plus the menu and a service page.
- `brand_logo/`, the company logo to use in the build (blue mason figure, "Dakrenovatie Midden Nederland"). Use this in the header/footer. Note: the reference screenshots show a *different* logo (red + grey roof wordmark), that's just the old site's logo; ignore it in favor of `brand_logo/`.
- `brand_flyer/aangepaste folder.pdf`, printed flyer; secondary brand reference.

When recreating sections, open the relevant `example_page` screenshot rather than guessing.

## Commands

```bash
npm install
npm run dev        # local dev server with HMR
npm run build      # production build to ./dist
npm run preview    # serve the production build locally
npm test           # Playwright end-to-end tests
```

## Brand / design system

Sample exact hex values from the `example_page` screenshots; approximate values:

- **Primary CTA / accent:** vermillion orange ≈ `#EE4B1A`. Used for the "Offerte aanvragen" buttons, stat band, icon circles, section dividers, and the contact block.
- **Active-menu highlight:** amber ≈ `#F39200` (mobile menu "Home" item).
- **Dark sections:** near-black charcoal ≈ `#1E1E1E` (feature cards, FAQ, footer/menu background).
- **Headings:** large bold dark-charcoal sans-serif, often uppercase (e.g. "DAKDEKKING VOOR ELK SEIZOEN", "VRAAG HIER UW GRATIS OFFERTE AAN").
- **Body:** medium-grey sans-serif, generous line height.

Buttons are sharp-cornered (not pill), solid orange, white uppercase text with wide letter-spacing.

## Site structure

**Navigation:** Home · Diensten (dropdown) · Contact. A persistent header carries the logo, hamburger menu, and an orange "Offerte aanvragen" button.

**Diensten (services) submenu**, each is its own page following the same template (orange eyebrow label, big headline, hero image, checklist, "Offerte aanvragen" + "Bel direct" buttons; see `example_page` service page):
Vervanging · Dak Renovatie · Dak Reparatie · Dakpannen Reparatie · Dakgoot · Lekdetectie · Stormschade Dakpannen · Schoorsteen Reparatie

**Homepage sections, in order:**
1. Hero, "Uw Dak, Onze Zorg" / "Dakdekking voor elk seizoen" + CTA, roof background image.
2. Feature cards (dark bg, orange icon circles): Maatwerk tot in de kleinste details · Duurzaamheid geworteld in elk project · Transparante communicatie · Afspraak = Afspraak · 24/7 Spoedservice.
3. Over Ons, intro copy + image.
4. Stats band (orange): 15 Jaar ervaring · 235 Tevreden daken · 951 Kopjes koffies.
5. Diensten, service cards/images.
6. Waarom voor ons kiezen?, image + reasons (Deskundigheid, …).
7. Klantbeoordelingen, testimonial **carousel** (e.g. "Lotte H.", "Marieke") with dot pagination.
8. FAQ, **accordion** (expand/collapse, +/− toggles), Dutch Q&A about dakpannen.
9. Offerte aanvragen, quote **form**: Voornaam, Achternaam, Email (Vereist), Telefoonnummer, … .
10. CTA band "Benieuwd naar de kosten?".
11. Contact informatie (orange) + footer.

**Contact details from the site:** phone `0614969048` (used in "Bel direct" buttons). A floating chat bubble ("Hallo daar, heb je een vraag?") appears bottom-right.

## Interactive pieces to build

These were plugin-driven on the WordPress site and need real implementations here:
- **Mobile menu**, slide-in panel with expandable "Diensten" submenu.
- **Testimonial carousel**, auto/slide with dot indicators.
- **FAQ accordion**, independent expand/collapse per item.
- **Quote form**, client validation; submits via **email for now** (e.g. a `mailto:` action or a simple form that opens the user's mail client). Keep submission logic isolated in one place so it can be swapped for a real backend/form service once hosting is chosen.

Prefer Astro components with minimal client-side JS (use `client:` directives only where interactivity is required: menu, carousel, accordion, form).

## Conventions

- Dutch-language content throughout; match the exact wording visible in `example_page` screenshots.
- Mobile-first, the only reference screenshots are mobile; design responsive layouts up from there and confirm desktop behavior with the user.
- Keep the WordPress/Colibri footer credit out of the rebuild unless the user wants it.
