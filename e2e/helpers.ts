import { Page, expect } from '@playwright/test';

/** A window frame by its title-bar label (windows are role=dialog). */
export const windowByTitle = (page: Page, title: string) =>
  page.getByRole('dialog', { name: title });

/** A desktop icon, scoped to the workspace (dock items share the same name). */
export const desktopIcon = (page: Page, title: string) =>
  page.getByRole('main', { name: 'Desktop workspace' }).getByRole('button', { name: `Open ${title}` });

/**
 * Load the desktop and wait for it to be interactive.
 * The app auto-opens the About window when no hash is present, so tests
 * start from a deterministic "About is open" state unless a hash is given.
 */
export async function loadDesktop(page: Page, hash = '') {
  // relative, so it resolves under the `/os/` base rather than the domain root
  await page.goto(`./${hash}`);
  await expect(page.getByRole('main', { name: 'Desktop workspace' })).toBeVisible();
  if (!hash) {
    await expect(windowByTitle(page, 'About_Me.pdf')).toBeVisible();
  }
}
