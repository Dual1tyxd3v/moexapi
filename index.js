const express = require('express');
const port = 3002;
const app = express();

const NG_OPT_URL = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities/NGF4.jsonp?iss.meta=off&iss.json=extended&callback=JSON_CALLBACK&lang=ru&contractname=1';

app.get('/', async (req, res) => {
  const data = await getOptions();
  res.send(data);
})

async function getOptions() {
  const resp = await fetch(NG_OPT_URL);
  if (!resp.ok) return ('Cant load NG options');

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