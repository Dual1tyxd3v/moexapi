const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendMessage } = require('../utils/telegramMessage');
const { parsePob } = require('../utils/poe');
const { getWeather } = require('../utils/weather');
const { parseNClub } = require('../utils/nClub');
const { getPositions, getOptions } = require('../utils/moex');
const { getFreeSteam } = require('../utils/freeSteam');
const port = 3002;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.set('trust proxy', true);

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

app.post('/message', async (req, res) => {
  const { message } = req.body || null;

  if (!message) res.send(JSON.stringify({ isSuccess: false, message: 'Empty message' }));

  const response = await sendMessage(message);
  res.send(JSON.stringify(response));
});

app.get('/freesteam', async (_, res) => {
  const resp = await getFreeSteam();

  res.send(JSON.stringify(resp));
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

async function universalLoader(url) {
  const resp = await fetch(url);
  return resp;
}

app.listen(port, (error) => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
