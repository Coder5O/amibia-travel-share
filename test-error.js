const puppeteer = require('puppeteer');
const handler = require('serve-handler');
const http = require('http');

const server = http.createServer((request, response) => {
  return handler(request, response, { public: 'dist' });
});

server.listen(3000, async () => {
  console.log('Running at http://localhost:3000');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await browser.close();
  server.close();
});
