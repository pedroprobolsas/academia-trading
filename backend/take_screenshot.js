const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1280, height: 800 });

  // Go to Register
  console.log('Navigating to /registro');
  await page.goto('http://localhost:5173/registro');
  
  // Fill register form
  const email = `new_student_${Date.now()}@example.com`;
  console.log(`Registering new user: ${email}`);
  await page.type('input[name="nombre_completo"]', 'Nuevo Estudiante');
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for redirect to login
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('At /login now. Logging in...');

  // Fill login form
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('At /dashboard now. Navigating to Journal...');

  // Click on Journal link in Sidebar
  await page.waitForSelector('a[href="/journal"]');
  await page.click('a[href="/journal"]');

  // Wait for network requests to settle (fetching plan)
  await page.waitForNetworkIdle();
  await page.waitForSelector('h2'); // "Crea tu Plan de Trading"
  
  // Take screenshot
  const screenshotPath = 'C:\\Users\\PEDRO SANDOVAL\\.gemini\\antigravity\\brain\\260dda40-b6e3-4cf5-9001-7494c53b30b0\\create_plan_guardian.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
