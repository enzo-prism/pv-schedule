import { expect, test } from "@playwright/test";

const formatLocalDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

test("user can add multiple media items to a meet", async ({ page }) => {
  const meetName = `Media Flow ${Date.now()}`;

  await page.goto("/");
  await expect(page.getByText("Enzo Sison")).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Add meet" }).click();

  await expect(page.getByLabel("Meet Name")).toBeVisible();
  await page.getByLabel("Meet Name").fill(meetName);
  await page.getByLabel("Date").fill(formatLocalDate(new Date()));
  await page.getByLabel("Location").fill("Test Track");
  await page.getByRole("button", { name: "Add Meet" }).click();

  await expect(page.getByRole("dialog", { name: "Add New Meet" })).toBeHidden();
  await expect(page.getByText(meetName)).toBeVisible();
  await page.getByText(meetName).click();
  await page.waitForURL(/\/meet\/\d+/);

  await page.getByRole("button", { name: "Add media" }).first().click();
  await expect(page.getByRole("dialog", { name: "Add Media" })).toBeVisible();

  const uploadInput = page.locator('input[type="file"][multiple]');
  await uploadInput.setInputFiles([
    {
      name: "jump.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake image"),
    },
    {
      name: "vault.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("fake video"),
    },
  ]);

  await expect(page.getByText("jump.png")).toBeVisible();
  await expect(page.getByText("vault.mp4")).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Save to meet" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page.getByRole("dialog", { name: "Add Media" })).toBeHidden({
    timeout: 20000,
  });
  await expect(page.getByText("jump.png")).toBeVisible();
  await expect(page.getByText("vault.mp4")).toBeVisible();
});
