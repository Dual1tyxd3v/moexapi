const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const NOOB_CLUB_URL = 'https://www.noob-club.ru';

async function parseNClub() {
  try {
    const resp = await fetch(NOOB_CLUB_URL);
    if (!resp.ok) {
      console.log(resp);
      return { data: null, error: resp.toString() };
    }

    const html = await resp.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const blocks = doc.querySelector('.content').querySelectorAll('.entry');

    const data = [...blocks].map((block) => {
      const title = block.querySelector('a').textContent;

      const link = block.querySelector('a');
      const src = NOOB_CLUB_URL + link.href.slice(link.href.lastIndexOf('/'));

      const content = block.querySelector('.entry-content');

      const img = content.querySelector('img').src;

      const text = content.textContent;
      return { title, src, img, text };
    });

    return { data, error: null };
  } catch (e) {
    console.log(e);
    return { data: null, error: e.message };
  }
}

module.exports = { parseNClub };
