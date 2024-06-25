const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const puppeteer = require('puppeteer');

const EMBED_URL = 'https://www.youtube.com/embed/';

const getVideo = async (url) => {
  try {
    const browser = await puppeteer.launch();
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

    return { data, error: '' };
  } catch (e) {
    console.log(e);
    return { data: [], error: e.message };
  }
};

module.exports = { getVideo };
