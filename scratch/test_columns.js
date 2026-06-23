const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://chs.dhbvn.org.in/ui/anonymous?PROJECTID=304&FORMID=11996', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);
    
    const selectInfo = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const distSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Palwal')));
      if (!distSelect) return null;
      return {
        id: distSelect.id,
        palwalValue: Array.from(distSelect.options).find(o => o.text.includes('Palwal'))?.value
      };
    });

    console.log('Select info:', selectInfo);

    await page.selectOption(`#${selectInfo.id}`, selectInfo.palwalValue);
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      const event = new Event('change', { bubbles: true });
      el.dispatchEvent(event);
    }, selectInfo.id);

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], a.btn'));
      const searchBtn = buttons.find(b => b.innerText.includes('Search') || (b.value && b.value.includes('Search')));
      if (searchBtn) searchBtn.click();
    });

    await page.waitForTimeout(5000);

    // Extract ALL column headers
    const headers = await page.evaluate(() => {
      const headerRow = document.querySelector('.ui-jqgrid-htable thead tr');
      if (!headerRow) return 'No header row found';
      return Array.from(headerRow.querySelectorAll('th')).map((th, i) => ({
        index: i,
        text: th.innerText.trim(),
        id: th.id,
        ariaLabel: th.getAttribute('aria-label')
      }));
    });
    console.log('TABLE HEADERS:', JSON.stringify(headers, null, 2));

    // Extract a few rows to verify column indexes
    const rows = await page.evaluate(() => {
      const table = document.querySelector('.ui-jqgrid-btable');
      if (!table) return 'Table not found';
      const trs = Array.from(table.querySelectorAll('tr'));
      // Get first 3 rows
      return trs.slice(0, 3).map((tr, i) => {
        const tds = Array.from(tr.querySelectorAll('td'));
        return {
          rowNum: i,
          cells: tds.map((td, ci) => ({
            index: ci,
            text: td.innerText.trim(),
            display: td.style.display,
            ariaLabel: td.getAttribute('aria-describedby')
          }))
        };
      });
    });
    console.log('\nFIRST 3 ROWS:', JSON.stringify(rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
