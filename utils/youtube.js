const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const puppeteer = require('puppeteer');

const chromium = require('@sparticuz/chromium');
const puppeteerCore = require('puppeteer-core');

const EMBED_URL = 'https://www.youtube.com/embed/';

const getVideo = async (url) => {
  try {
    let browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    if (process.env.NODE_ENV === 'development') {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });
    }

    const page = await browser.newPage();

    await page.goto(url);

    const html = await page.content();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const videoCollection = [...doc.querySelectorAll('#content')];
    
    const data = videoCollection.slice(2).map((content) => {
      const title = content.querySelector('#video-title').textContent;
      const postedTime = content.querySelectorAll('.inline-metadata-item')[1].textContent;
      
      const href = content.querySelector('a').getAttribute('href').split('=')[1];
      const src = `${EMBED_URL}${href}`;
      
      return { title, postedTime, src };
    });
    browser.close();

    return { data, error: '' };
  } catch (e) {
    console.log(e);
    return { data: [], error: e.message };
  }
};

module.exports = { getVideo };
