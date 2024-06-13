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

async function getItems(accountName, realm, character) {
  const url = 'https://www.pathofexile.com/character-window/get-items';
  try {
    const resp = await fetch(`${url}?accountName=${accountName}&realm=${realm}&character=${character}`, {
      headers: {},
    });
    if (!resp.ok) {
      console.log(resp);
      return { data: null, error: resp.statusText };
    }
    const data = await resp.json();

    return { data, error: '' };
  } catch (e) {
    console.log(e);
    return { data: null, error: e.message };
  }
}

async function getWeather(ip) {
  try {
    // Location
    const LOCATION_URL = 'http://ip-api.com/json/';
    const location = await fetch(LOCATION_URL);
    const { country, city } = await location.json();

    if (!country || !city) return { data: null, error: 'Cant get location' };

    const CURRENT_WEATHER = `https://www.timeanddate.com/weather/${country}/${city}`;
    const FORECAST_WEATHER = `https://www.timeanddate.com/weather/${country}/${city}/ext`;

    const current = fetch(CURRENT_WEATHER);
    const forecast = fetch(FORECAST_WEATHER);

    const resp = await Promise.all([current, forecast]);
    if (!resp.ok) {
      console.log(resp.statusText);
      return { data: null, error: resp.statusText };
    }

    // Current weather
    const currentHTML = await resp[0].text();
    const currentDom = new JSDOM(currentHTML);
    const currentDoc = currentDom.window.document;

    const currentBlock = currentDoc.querySelector('.bk-focus');

    const temp = currentBlock.querySelector('.h2').textContent;

    const [, , , , pressure, humidity] = [...currentBlock.querySelectorAll('tr')].map((tr) => {
      const td = tr.querySelector('td');
      return td.textContent || '_';
    });

    const icon = `https:${currentBlock.querySelector('#cur-weather').getAttribute('src')}`;
    // Forecast weather
    const forecastHTML = await resp[1].text();
    const forecastDom = new JSDOM(forecastHTML);
    const forecastDoc = forecastDom.window.document;

    const table = forecastDoc.querySelector('#wt-ext').querySelector('tbody');
    const forecastTemp = [...table.querySelectorAll('tr')].map((tr) => {
      // console.log(tr.textContent);
      const td = tr.querySelectorAll('td')[1].textContent;
      const [max, min] = td.split(' / ').map((temp) => parseInt(temp));

      return {
        max,
        min,
        average: (min + max) / 2,
      };
    });

    return { temp, pressure, humidity, icon, forecastTemp };
  } catch (e) {
    console.log(e);
  }
}

module.exports = { parsePob, getWeather, parseFilms, parseNClub, sendMessage, getItems };
