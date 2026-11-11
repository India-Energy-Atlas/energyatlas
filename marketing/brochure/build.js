// Renders brochure.html to PDF + page PNG previews. Usage: node build.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.join(__dirname, 'brochure.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  await p.pdf({
    path: path.join(__dirname, 'India-Energy-Atlas-Brochure.pdf'),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(__dirname, `preview-page-${i + 1}.png`) });
  }
  // overflow check: body content must end above the pinned footer
  const report = await p.evaluate(() =>
    [...document.querySelectorAll('.page')].map((pg) => {
      const r = pg.getBoundingClientRect();
      let max = 0;
      pg.querySelectorAll(':scope > :not(.trust):not(.cta)').forEach((e) => {
        max = Math.max(max, e.getBoundingClientRect().bottom - r.top);
      });
      const foot = pg.querySelector('.trust,.cta').getBoundingClientRect().top - r.top;
      return { contentBottom: Math.round(max), footerTop: Math.round(foot), pageH: Math.round(r.height) };
    })
  );
  console.log(JSON.stringify(report));
  await b.close();
})();
