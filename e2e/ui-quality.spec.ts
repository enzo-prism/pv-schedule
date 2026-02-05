import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const disableMotion = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
};

const waitForFonts = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready);
};

const runColorContrastAudit = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
};

const openFirstMeet = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("main").waitFor();
  await disableMotion(page);
  await waitForFonts(page);

  const firstMeet = page.locator('a[href^="/meet/"]').first();
  await expect(firstMeet).toBeVisible();
  await firstMeet.click();
  await page.waitForURL(/\/meet\//);
  await disableMotion(page);
  await waitForFonts(page);
};

test.describe("ui contrast", () => {
  test("home page passes color contrast checks", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").waitFor();
    await disableMotion(page);
    await waitForFonts(page);
    await runColorContrastAudit(page);
  });

  test("meet details passes color contrast checks", async ({ page }) => {
    await openFirstMeet(page);
    await runColorContrastAudit(page);
  });

  test("trends page passes color contrast checks", async ({ page }) => {
    await page.goto("/trends");
    await page.getByRole("main").waitFor();
    await disableMotion(page);
    await waitForFonts(page);
    await runColorContrastAudit(page);
  });
});

test.describe("ui visual", () => {
  test("home page matches snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("main").waitFor();
    await disableMotion(page);
    await waitForFonts(page);
    await expect(page).toHaveScreenshot("home.png", {
      fullPage: true,
    });
  });

  test("meet details page matches snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openFirstMeet(page);
    await expect(page).toHaveScreenshot("meet-details.png", {
      fullPage: true,
    });
  });

  test("trends page matches snapshot", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/trends");
    await page.getByRole("main").waitFor();
    await disableMotion(page);
    await waitForFonts(page);
    await expect(page).toHaveScreenshot("trends.png", {
      fullPage: true,
    });
  });
});
