const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { parseNClub, parsePob, sendMessage, getItems, getWeather } = require('../utils');
const port = 3002;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.set('trust proxy', true);

const NG_OPT_URL =
  'https://iss.moex.com/iss/engines/futures/markets/forts/securities/NGH4.jsonp?iss.meta=off&iss.json=extended&callback=JSON_CALLBACK&lang=ru&contractname=1';

const NG_POSITIONS_URL = 'https://www.moex.com/api/contract/OpenOptionService/06.01.2124/F/NG/json';

app.get('/options', async (_, res, next) => {
  const data = await getOptions();
  res.send(data);
});

app.get('/weather', async (req, res) => {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',').pop() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
  const data = await getWeather(ip);
  res.send(data);
});

app.get('/positions', async (_, res, next) => {
  const data = await getPositions();
  res.send(data);
});

app.post('/pob', async (req, res) => {
  const { url } = req.body || null;
  if (!url) res.send({ data: null, error: 'Need url' });
  const data = await parsePob(url);

  res.send(JSON.stringify(data));
});

app.get('/', (req, res) => res.send('Express on Vercel'));

/* app.post('/films', async (req, res) => {
  const { url } = req.body || null;
  if (!url) res.send({ data: null, error: 'Broken URL' });

  const data = await parseFilms(url);

  res.send(JSON.stringify(data));
}); */

app.post('/message', async (req, res) => {
  const { message } = req.body || null;

  if (!message) res.send(JSON.stringify({ isSuccess: false, message: 'Empty message' }));

  const response = await sendMessage(message);
  res.send(JSON.stringify(response));
});

app.get('/nclub', async (_, res) => {
  const data = await parseNClub();

  res.send(JSON.stringify(data));
});

app.post('/universal', async (req, res, next) => {
  const url = req.body.url;
  const resp = await universalLoader(url);
  const text = await resp.text();
  res.send(text);
});

app.post('/poestats', async (req, res) => {
  const { accountName, realm, character } = req.body;
  console.log('TOUCHED');
  if (!accountName || !realm || !character) res.send({ data: null, error: 'Wrong data' });

  const data = await getItems(accountName, realm, character);
  res.send(JSON.stringify(data));
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

app.listen(port, (error) => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
