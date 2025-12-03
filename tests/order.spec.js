// tests/order.spec.js
const { test, expect } = require('@playwright/test');

test('Cek pesanan -> Buat Pesanan -> WA & admin open', async ({ page, context }) => {
  await page.goto('http://localhost:3000');

  // fill form
  await page.fill('#ultraNama', 'Test User');
  await page.fill('#ultraWA', '081234567890');
  await page.click('input[name="ultraJenis"][value="Original"]');
  await page.selectOption('#ultraIsi', '5');
  await page.click('input[name="ultraToppingMode"][value="single"]');

  // select first topping
  await page.click('#ultraSingleGroup input[name="topping"]');

  // submit (Cek pesanan)
  await page.click('#ultraSubmit');

  // popup should appear
  await expect(page.locator('#notaContainer')).toHaveClass(/show/);

  // intercept new pages
  const [waPagePromise] = await Promise.all([
    context.waitForEvent('page'),
    page.click('#notaConfirm') // this will try to open WA + admin
  ]);

  // check WA page url contains wa.me
  const waPage = waPagePromise;
  await waPage.waitForLoadState('domcontentloaded');
  const url = waPage.url();
  expect(url).toContain('wa.me');

  // admin page should be opened in another page
  const pages = context.pages();
  const adminPage = pages.find(p => p.url().includes('admin.html') || p.url().includes('/admin.html'));
  expect(adminPage).toBeTruthy();
  if (adminPage) {
    await adminPage.waitForLoadState('domcontentloaded');
    await expect(adminPage.locator('#ordersList')).toBeVisible();
  }
});
