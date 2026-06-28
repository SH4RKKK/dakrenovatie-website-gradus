import { test, expect, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

// Collect uncaught page errors so we can assert pages are JS-clean.
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

// Every service slug from src/data/site.ts — each renders through the same
// [slug].astro template, so testing all of them catches a broken slug/route.
const SERVICE_SLUGS = [
  "dak-renovatie",
  "vervanging",
  "dak-reparatie",
  "dakpannen-reparatie",
  "dakgoot",
  "lekdetectie",
  "stormschade-dakpannen",
  "schoorsteen-reparatie",
];

test.describe("pages load and are JS-clean", () => {
  const paths = [
    "/",
    "/contact",
    "/diensten",
    "/beoordelingen",
    ...SERVICE_SLUGS.map((s) => `/diensten/${s}`),
  ];
  for (const path of paths) {
    test(`loads ${path} without page errors`, async ({ page }) => {
      const errors = trackErrors(page);
      const res = await page.goto(path);
      expect(res?.status(), `status for ${path}`).toBeLessThan(400);
      // Scope to the site's own chrome: Playwright's CSS engine pierces shadow
      // DOM, so a bare "header"/"footer" also matches the Astro dev toolbar's
      // injected elements (dev-only). These classes are unique to our layout.
      await expect(page.locator("header.sticky")).toBeVisible();
      await expect(page.locator("footer.bg-ink")).toBeVisible();
      expect(errors, `page errors on ${path}`).toEqual([]);
    });
  }
});

test.describe("homepage content", () => {
  test("hero, sections and key copy are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dakdekking");
    await expect(page.getByText("Over Ons")).toBeVisible();
    await expect(page.getByText("951")).toBeVisible(); // stats band
    await expect(page.getByText("Veelgestelde vragen")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Vraag hier uw gratis offerte aan/i })
    ).toBeVisible();
  });
});

test.describe("desktop navigation", () => {
  test.use({ viewport: DESKTOP });

  test("nav links and CTA are visible; hamburger hidden", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Beoordelingen" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Contact" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Offerte aanvragen" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu openen" })).toBeHidden();
  });

  test("Contact link navigates to the contact page", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
    await expect(page.getByRole("heading", { name: /Neem contact met ons op/i })).toBeVisible();
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: MOBILE });

  test("opens, expands the Diensten submenu, and closes", async ({ page }) => {
    await page.goto("/");
    const openBtn = page.getByRole("button", { name: "Menu openen" });
    await expect(openBtn).toBeVisible();

    await openBtn.click();
    // Scope to the mobile submenu (the same service names also appear in the
    // homepage services grid, so an unscoped lookup would match those too).
    const submenuItem = page
      .locator("#submenu")
      .getByRole("link", { name: "Stormschade Dakpannen" });
    await expect(submenuItem).toBeHidden(); // submenu collapsed initially

    await page.getByRole("button", { name: "Diensten" }).click();
    await expect(submenuItem).toBeVisible();

    await page.getByRole("button", { name: "Menu sluiten" }).click();
    await expect(page.getByRole("button", { name: "Menu sluiten" })).toBeHidden();
  });
});

test.describe("FAQ accordion", () => {
  test("expands an item on click", async ({ page }) => {
    await page.goto("/");
    const firstItem = page.locator("details").first();
    await expect(firstItem).not.toHaveAttribute("open", "");
    await firstItem.locator("summary").click();
    await expect(firstItem).toHaveAttribute("open", "");
  });
});

test.describe("testimonial carousel", () => {
  test("clicking a dot activates it", async ({ page }) => {
    await page.goto("/");
    const dot2 = page.locator("[data-dot='2']");
    await dot2.scrollIntoViewIfNeeded();
    await dot2.click();
    await expect(dot2).toHaveAttribute("data-active", "");
  });
});

test.describe("quote form validation", () => {
  test("shows an error when email is missing", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByText("Vul een geldig e-mailadres in.")).toBeVisible();
    // Still on the contact page (no mailto navigation triggered).
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test("requires a postcode once the email is valid", async ({ page }) => {
    await page.goto("/contact");
    await page.locator("#email").fill("klant@example.com");
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByText("Vul uw postcode in.")).toBeVisible();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test("submits a valid request and shows the thank-you message", async ({ page }) => {
    // Stub the backend so the submit fires without sending real mail.
    let posted: any = null;
    await page.route("**/api/contact", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });

    await page.goto("/contact");
    await page.locator("#voornaam").fill("Jan");
    await page.locator("#email").fill("klant@example.com");
    await page.locator("#postcode").fill("1234 AB");
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();

    await expect(page.getByText("Bedankt voor uw aanvraag!")).toBeVisible();
    expect(posted?.email).toBe("klant@example.com");
    expect(posted?.postcode).toBe("1234 AB");
  });
});

test.describe("review modal", () => {
  test("opens from the homepage and validates required fields", async ({ page }) => {
    await page.goto("/");
    const dialog = page.locator("#review-dialog");
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Schrijf een review" }).click();
    await expect(dialog).toBeVisible();

    // Empty submit surfaces the email error first.
    await dialog.getByRole("button", { name: "Verstuur review" }).click();
    await expect(page.getByText("Vul een geldig e-mailadres in.")).toBeVisible();

    // With a valid email but no postcode, the postcode error shows.
    await page.locator("#rev-email").fill("klant@example.com");
    await dialog.getByRole("button", { name: "Verstuur review" }).click();
    await expect(page.getByText("Vul uw postcode in.")).toBeVisible();
  });

  test("submits a valid review and shows the thank-you message", async ({ page }) => {
    let posted: any = null;
    await page.route("**/api/review", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });

    await page.goto("/beoordelingen");
    await page.getByRole("button", { name: "Schrijf een review" }).first().click();
    const dialog = page.locator("#review-dialog");
    await expect(dialog).toBeVisible();

    await page.locator("#rev-email").fill("klant@example.com");
    await page.locator("#rev-postcode").fill("1234 AB");
    await page.locator("#rev-bericht").fill("Uitstekend werk aan ons dak.");
    await dialog.getByRole("button", { name: "Verstuur review" }).click();

    await expect(page.getByText("Bedankt voor uw review!")).toBeVisible();
    expect(posted?.email).toBe("klant@example.com");
    expect(posted?.review).toBe("Uitstekend werk aan ons dak.");
  });

  test("closes on Escape and returns focus to the trigger", async ({ page }) => {
    await page.goto("/beoordelingen");
    const trigger = page.getByRole("button", { name: "Schrijf een review" }).first();
    await trigger.click();
    const dialog = page.locator("#review-dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("reviews page", () => {
  test("renders seeded reviews and a write-review action", async ({ page }) => {
    await page.goto("/beoordelingen");
    await expect(
      page.getByRole("heading", { name: /Wat onze klanten zeggen/i })
    ).toBeVisible();
    await expect(page.locator(".review-card").first()).toBeVisible();
  });

  test("lazy-loads remaining reviews on scroll", async ({ page }) => {
    await page.goto("/beoordelingen");
    const hidden = page.locator(".review-card.hidden");
    const initialHidden = await hidden.count();
    // Only meaningful when there are more reviews than the initial batch.
    test.skip(initialHidden === 0, "fewer reviews than the batch size; nothing to lazy-load");

    for (let i = 0; i < 8 && (await hidden.count()) > 0; i++) {
      await page.mouse.wheel(0, 20000);
      await page.waitForTimeout(150);
    }
    await expect(hidden).toHaveCount(0);
  });
});

test.describe("service template", () => {
  test("renders headline and benefit bullets", async ({ page }) => {
    await page.goto("/diensten/dak-renovatie");
    await expect(
      page.getByRole("heading", { name: /Een compleet vernieuwd dak/i })
    ).toBeVisible();
    await expect(
      page.getByText("Volledige inspectie en helder renovatieplan vooraf")
    ).toBeVisible();
  });
});
