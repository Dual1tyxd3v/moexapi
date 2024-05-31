const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const NOOB_CLUB_URL = 'https://www.noob-club.ru';
const POEWIKI_URL = 'https://www.poewiki.net/wiki/';
const MESSAGE_URL =
  'https://api.telegram.org/bot5910914438:AAGnFKdoICio2rw007B1IItl7ovDFSpOpcs/sendMessage?chat_id=968980307&parse_mode=html&text=';

async function parsePob(url) {
  try {
    const formatedUrl = url.replace('/ru/', '/us/');
    const splittedUrl = url.split('/');
    const itemName = splittedUrl[splittedUrl.length - 1];

    const imageResp = await fetch(`${POEWIKI_URL}${itemName}`);
    if (!imageResp.ok) throw new Error('Cant load image URL');

    const imageHtml = await imageResp.text();
    const imageDom = new JSDOM(imageHtml);
    const imageDoc = imageDom.window.document;

    const prefixUrl = 'https://www.poewiki.net';
    const imageSrc = imageDoc.querySelector('.images').querySelector('img').src.split('.png')[0] + '.png';

    const resp = await fetch(formatedUrl);
    if (!resp.ok) throw new Error('Cant load DB URL');

    const html = await resp.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const header = doc.querySelector('.itemHeader');
    const name = [...header.querySelectorAll('.itemName')].map((div) => div.textContent);

    const level = +doc.querySelector('.requirements').querySelector('span').textContent || -1;

    const implicit = doc.querySelector('.implicitMod')?.textContent || '---';

    const regex = /(<([^>]+)>)/gi;
    const explicit = doc
      .querySelector('.explicitMod')
      .innerHTML.split('<br>')
      .map((str) => str.replace(regex, ''));

    const text = doc.querySelector('.FlavourText').innerHTML.split('<br>').join('\n');

    const drops = imageDoc.querySelector('#Item_acquisition').closest('h2').nextSibling;
    const source = drops.querySelector('.mw-redirect') ? drops.querySelector('.mw-redirect').textContent : 'world drop';

    return { data: { name, level, implicit, explicit, text, image: `${prefixUrl}${imageSrc}`, source }, error: '' };
  } catch (e) {
    console.log(e);
    return { data: null, error: 'Cant load URL' };
  }
}

async function parseFilms(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.log('Cant load URL', resp);
      return { data: null, error: 'Cant load url' };
    }

    const html = await resp.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const [films, , , newSerials, newSeasons] = [...doc.querySelectorAll('.box4')];
    const data = [films, newSerials, newSeasons].map((block) => {
      return parseFilmDetails(block);
    });

    return { data, error: null };
  } catch (e) {
    console.log(e);
    return { data: null, error: 'Something went wrong :(' };
  }
}
function parseFilmDetails(filmDiv) {
  return [...filmDiv.querySelectorAll('.short')].map((film) => {
    const imgSrc = film.querySelector('img').dataset.srcset.replace(' 190w', '');
    const title = film.querySelector('a').textContent;

    const src = film.querySelector('a').href.slice(film.querySelector('a').href.lastIndexOf('/'));

    return {
      imgSrc,
      title,
      src,
    };
  });
}

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

async function sendMessage(msg) {
  try {
    const resp = await fetch(`${MESSAGE_URL}${msg}`);

    return { isSuccess: resp.ok ? true : false, message: '' };
  } catch (e) {
    console.log(e);
    return { isSuccess: false, message: e.message };
  }
}

module.exports = { parsePob, parseFilms, parseNClub, sendMessage };
