const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// const jsdom = require('jsdom');
const port = 3002;
const app = express();

app.use(cors());
app.use(bodyParser.json());

// const { JSDOM } = jsdom;
const POEWIKI_URL = 'https://www.poewiki.net/wiki/';
const NG_OPT_URL =
  'https://iss.moex.com/iss/engines/futures/markets/forts/securities/NGH4.jsonp?iss.meta=off&iss.json=extended&callback=JSON_CALLBACK&lang=ru&contractname=1';

const NG_POSITIONS_URL = 'https://www.moex.com/api/contract/OpenOptionService/06.01.2124/F/NG/json';

app.get('/options', async (_, res, next) => {
  const data = await getOptions();
  res.send(data);
});

app.get('/positions', async (_, res, next) => {
  const data = await getPositions();
  res.send(data);
});

/* app.post('/pob', async (req, res) => {
  const { url } = req.body || null;
  if (!url) res.send({ data: null, error: 'Need url' });
  const data = await parsePob(url);

  res.send(JSON.stringify(data));
}); */

/* app.post('/films', async (req, res) => {
  const { url } = req.body || null;
  if (!url) res.send({ data: null, error: 'Broken URL' });

  const data = await parseFilms(url);

  res.send(JSON.stringify(data));
}); */

app.post('/universal', async (req, res, next) => {
  const url = req.body.url;
  const resp = await universalLoader(url);
  const text = await resp.text();
  res.send(text);
});

async function universalLoader(url) {
  const resp = await fetch(url);
  return resp;
}

async function getPositions() {
  const resp = await fetch(NG_POSITIONS_URL);
  if (!resp.ok) return { error: 'Cant load NG positions' };

  const data = await resp.json();
  const [total, change] = data;
  // console.log(data);
  return { total, change };
}

async function getOptions() {
  const resp = await fetch(NG_OPT_URL);
  if (!resp.ok) return { error: 'Cant load NG options' };

  const data = await resp.text();
  const result = JSON.parse(data.replace('JSON_CALLBACK(', '').slice(0, -1));
  const { STEPPRICE, INITIALMARGIN } = result[1].securities[0];
  return { step: STEPPRICE, go: INITIALMARGIN };
}

const server = app.listen(port, (error) => {
  // console.log('Server ready');
  console.log(`Server listening on port ${server.address().port}`);
});

async function parsePob(url) {
  try {
    const formatedUrl = url.replace('/ru/', '/us/');
    const splittedUrl = url.split('/');
    const itemName = splittedUrl[splittedUrl.length - 1];

    const imageResp = await fetch(`${POEWIKI_URL}${itemName}`);
    if (!imageResp.ok) throw new Error('Cant load URL');

    const imageHtml = await imageResp.text();
    const imageDom = new JSDOM(imageHtml);
    const imageDoc = imageDom.window.document;

    const prefixUrl = 'https://www.poewiki.net';
    const imageSrc = imageDoc.querySelector('.images').querySelector('img').src.split('.png')[0] + '.png';

    const resp = await fetch(formatedUrl);
    if (!resp.ok) throw new Error('Cant load URL');

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
      console.log('Cant load URL');
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

module.exports = app;
