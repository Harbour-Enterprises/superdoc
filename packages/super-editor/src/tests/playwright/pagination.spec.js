import { test, expect } from '@playwright/test';

// Tests in this file will share a page object
let page;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto('http://localhost:4173');
});

test('should be positioned at (0, 0) and have the correct dimensions', async () => {
  await page.waitForSelector('#editor');

  // Verify the bounding box (position & size)
  const editorDiv = await page.$("#editor");
  const rect = await editorDiv.boundingBox();

  expect(rect.x).toBe(0);
  expect(rect.y).toBe(0);
});

test('can pass file data into playwright', async () => {
  await page.waitForFunction(() => typeof window.initTestApp === 'function');

  const result = await page.evaluate(async () => {
    await window.initTestApp();

    // const json = window.editorCommand('getJSON');
    // return json;

    const plugins = await window.getPaginationState();
    return plugins;

    /**
     * TODO: The playwright editor is rendering pagination incorrectly (though at least it's rendering it).
     * We need to find out why it is incorrect, and fix it.
     * 
     * Then we need to write tests for the expected location of the pagination.
     */
  });
});
