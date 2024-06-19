const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const POEWIKI_URL = 'https://www.poewiki.net/wiki/';

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

    const level = +doc.querySelector('.requirements')?.querySelector('span')?.textContent || -1;

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
    return { data: null, error: e.message };
  }
}

module.exports = { parsePob };
