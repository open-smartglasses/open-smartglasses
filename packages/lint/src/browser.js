import { chromium } from 'playwright-core';

// Use Playwright's own Chromium when it is installed, otherwise a system Chrome or Edge.
export async function launch() {
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    'No Chromium browser found. Install Chrome, or run "npx playwright install chromium".\n' +
      lastError.message.split('\n')[0],
  );
}
