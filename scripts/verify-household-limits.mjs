// Proves the household hard constraints in the rendered app, not only in the model.
//
// The plan makes bedrooms and pets hard constraints for a household decision and
// says that unknown evidence "cannot silently pass a hard constraint". This drives
// the real interface: it states a household requirement, enters a home, and checks
// that the app reports the premise as unchecked, then as a failure, then as met.
//
//   PILOT_URL=https://bangkok-ioc.pages.dev/places node scripts/verify-household-limits.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ??
    '/Users/nonarkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--disable-gpu'],
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    reducedMotion: 'reduce',
  });
  const p = await context.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(process.env.PILOT_URL ?? 'http://127.0.0.1:4174/places', {
    timeout: 120000,
  });
  await p.locator('#pf-place-name').waitFor();
  await p.getByLabel('Purpose', { exact: true }).selectOption('live');
  await p.evaluate(() => document.fonts.ready);

  // The household states its requirement once, in the limits panel.
  const panel = p.getByLabel('Budget & journey', { exact: true });
  await panel.click();
  await p.getByPlaceholder('e.g. Silom').fill('Silom');
  await p.getByLabel('Bedrooms you need', { exact: true }).fill('3');
  await p.getByLabel('Household has pets', { exact: true }).check();
  await panel.click();
  await p.waitForTimeout(300);

  // A home is entered at the station area: rent, extras, a checked walk and a
  // checked journey that all satisfy the stated budget and travel preference.
  await p.getByLabel('Quoted rent / month', { exact: true }).fill('15000');
  await p.getByLabel('Monthly extras', { exact: true }).fill('2000');
  await p.getByLabel('Home-to-station access', { exact: true }).selectOption('walk');
  await p
    .getByLabel('Journey minutes you checked', { exact: true })
    .fill('20');
  await p.waitForTimeout(500);

  const result = p.locator('.pf-fit-result');
  const read = async () => (await result.innerText()).trim();

  const unchecked = await read();
  assert.match(unchecked, /Needs checking/, `expected an unchecked home to need checking, got: ${unchecked}`);
  assert.match(
    unchecked,
    /Record the bedrooms in this home; your household needs 3\./,
    `the bedroom requirement was not reported as unchecked: ${unchecked}`,
  );
  assert.match(
    unchecked,
    /Confirm whether pets are allowed in this building\./,
    `the pet requirement was not reported as unchecked: ${unchecked}`,
  );
  results.push({ step: 'unchecked home', text: unchecked });

  // A home that is too small for the household fails the limit.
  await p.getByLabel('Bedrooms in this home', { exact: true }).fill('1');
  await p.waitForTimeout(400);
  const tooSmall = await read();
  assert.match(tooSmall, /Does not meet your limits/, `expected a failure, got: ${tooSmall}`);
  assert.match(
    tooSmall,
    /This home has 1 bedroom; your household needs 3\./,
    `the bedroom shortfall was not reported: ${tooSmall}`,
  );
  results.push({ step: 'home too small', text: tooSmall });

  // A home that is big enough but refuses pets still fails.
  await p.getByLabel('Bedrooms in this home', { exact: true }).fill('3');
  await p
    .getByLabel('Pets allowed in this building', { exact: true })
    .selectOption('no');
  await p.waitForTimeout(400);
  const noPets = await read();
  assert.match(noPets, /Does not meet your limits/, `expected a failure, got: ${noPets}`);
  assert.match(
    noPets,
    /This building does not allow pets\./,
    `the pet refusal was not reported: ${noPets}`,
  );
  results.push({ step: 'building refuses pets', text: noPets });

  // A home that satisfies both requirements passes.
  await p
    .getByLabel('Pets allowed in this building', { exact: true })
    .selectOption('yes');
  await p.waitForTimeout(400);
  const met = await read();
  assert.match(met, /Meets your entered limits/, `expected a pass, got: ${met}`);
  results.push({ step: 'requirement met', text: met });

  // The comparison table must carry both dimensions, not hide them.
  await p.getByRole('button', { name: 'Shortlist this area', exact: true }).click();
  await p.getByLabel('Area', { exact: true }).selectOption('on-nut');
  await p.getByRole('button', { name: 'Shortlist this area', exact: true }).click();
  await p.getByRole('button', { name: /Compare \(/ }).click();
  await p.waitForTimeout(600);
  const rows = await p.locator('.pf-comparison-data table th').allInnerTexts();
  const rowNames = rows.map((r) => r.trim());
  assert.ok(rowNames.includes('Bedrooms'), `comparison is missing the bedrooms row: ${rowNames.join(' | ')}`);
  assert.ok(rowNames.includes('Pets'), `comparison is missing the pets row: ${rowNames.join(' | ')}`);
  const table = await p.locator('.pf-comparison-data table').innerText();
  assert.match(table, /you need 3/, `the comparison does not show the household requirement: ${table.slice(0, 600)}`);
  results.push({ step: 'comparison rows', rows: rowNames });

  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
console.log(
  'HOUSEHOLD LIMIT PASS: a stated requirement is never passed by an unchecked home, a contradicted home fails, and the comparison carries both dimensions.',
);
