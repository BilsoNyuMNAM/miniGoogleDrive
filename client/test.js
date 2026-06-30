import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to local production server...');
  await page.goto('http://localhost:3001');
  
  console.log('Clicking on Notes tab...');
  // The nav bar has a button for Notes, let's find it.
  // Wait for sidebar nav
  await page.waitForSelector('.sidebar-nav');
  // Click the Notes button (it's usually the second one or has some specific text/icon)
  // Let's just evaluate in page to click the button with text "Notes"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.nav-item'));
    const notesBtn = btns.find(b => b.textContent.includes('Notes'));
    if (notesBtn) notesBtn.click();
  });

  // Wait for notes to load
  await page.waitForSelector('.note-item', { timeout: 10000 });
  
  // Click on the Notion note. Let's find one with Notion ID or just click the first one
  console.log('Clicking the note...');
  await page.click('.note-item');
  
  // Wait a bit to let any errors pop up
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  console.log('Done.');
})();
