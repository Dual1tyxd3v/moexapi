const express = require('express');
const port = 3002;
const app = express();

const NG_OPT_URL = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities/NGF4.jsonp?iss.meta=off&iss.json=extended&callback=JSON_CALLBACK&lang=ru&contractname=1';

const NG_POSITIONS_URL = 'https://www.moex.com/api/contract/OpenOptionService/06.01.2024/F/NG/json';

app.get('/', async (req, res) => {
  const data = await getOptions();
  res.send(data);
})

app.get('/positions', async (_, res) => {
  const data = await getPositions();
  res.send(data);
});

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

module.exports = app;