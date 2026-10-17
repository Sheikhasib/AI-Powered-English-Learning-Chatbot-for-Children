import { expect, test } from "@playwright/test";

test("home page shows the placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pip is coming" })).toBeVisible();
});
