const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://chs.dhbvn.org.in/ui/anonymous?PROJECTID=304&FORMID=11996', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait a bit for page to load fully
    await page.waitForTimeout(5000);
    
    // Retrieve all districts from the dropdown
    const selectInfo = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const distSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Palwal')));
      if (!distSelect) return null;
      return {
        id: distSelect.id,
        palwalValue: Array.from(distSelect.options).find(o => o.text.includes('Palwal'))?.value
      };
    });

    if (!selectInfo || !selectInfo.palwalValue) {
      console.log('Could not find Palwal option in any select');
      return;
    }

    console.log('Selecting Palwal:', selectInfo);

    // select Palwal
    await page.selectOption(`#${selectInfo.id}`, selectInfo.palwalValue);
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      const event = new Event('change', { bubbles: true });
      el.dispatchEvent(event);
    }, selectInfo.id);

    await page.waitForTimeout(2000);

    // Click Search
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], a.btn'));
      const searchBtn = buttons.find(b => b.innerText.includes('Search') || (b.value && b.value.includes('Search')));
      if (searchBtn) searchBtn.click();
    });

    await page.waitForTimeout(5000);

    // Extract raw tds
    const data = await page.evaluate(() => {
      const table = document.querySelector('.ui-jqgrid-btable');
      if (!table) return 'Table not found';
      const trs = Array.from(table.querySelectorAll('tr'));
      return trs.map((tr, i) => {
        const tds = Array.from(tr.querySelectorAll('td'));
        return {
          rowNum: i,
          tds: tds.map(td => ({
            text: td.innerText.trim(),
            html: td.outerHTML
          }))
        };
      }).filter(row => row.tds.length > 0);
    });

    console.log(JSON.stringify(data.slice(0, 10), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
