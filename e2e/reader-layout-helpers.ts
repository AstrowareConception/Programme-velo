import type { Page } from "@playwright/test";

export async function openReaderDetails(page: Page) {
  const button = page.getByRole("button", { name: "Réglages et détails", exact: true });
  if (await button.isVisible() && await button.getAttribute("aria-expanded") === "false") await button.click();
}

export async function closeReaderDetails(page: Page) {
  const button = page.getByRole("button", { name: "Revenir à la séance", exact: true });
  if (await button.isVisible()) await button.click();
}
