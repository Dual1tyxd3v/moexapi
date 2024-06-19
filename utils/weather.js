const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function fahrToCelc(f) {
  return Math.floor(((parseInt(f) - 30) * 5) / 9);
}

function hgToMbar(h) {
  return Math.floor(parseInt(h) * 33.8639);
}

const MS_PER_DAY = 86400000;
function formatDate(time, i) {
  const forecastDay = new Date(time + MS_PER_DAY * (i + 1));

  const date = forecastDay.getDate().toString().padStart(2, '0');
  const month = (forecastDay.getMonth() + 1).toString().padStart(2, '0');
  const year = forecastDay.getFullYear();

  return `${date}-${month}-${year}`;
}

async function getWeather(ip) {
  try {
    // Location
    const LOCATION_URL = `http://ip-api.com/json/${ip}`;
    const location = await fetch(LOCATION_URL);

    if (!location.ok) {
      return { data: null, error: 'Cant load location' };
    }

    const { country, city } = await location.json();

    if (!country || !city) return { data: null, error: 'Cant get location' };

    const CURRENT_WEATHER = `https://www.timeanddate.com/weather/${country.toLowerCase()}/${city.toLowerCase()}`;
    const FORECAST_WEATHER = `https://www.timeanddate.com/weather/${country.toLowerCase()}/${city.toLowerCase()}/ext`;

    const current = fetch(CURRENT_WEATHER);
    const forecast = fetch(FORECAST_WEATHER);

    const resp = await Promise.all([current, forecast]);
    if (!resp[0].ok || !resp[1].ok) {
      console.log(resp.statusText);
      return {
        data: null,
        error: resp.statusText || 'Promise error',
        r1: resp[0].statusText,
        r2: resp[1].statusText,
        url1: CURRENT_WEATHER,
        url2: FORECAST_WEATHER,
      };
    }

    // Current weather
    const currentHTML = await resp[0].text();
    const currentDom = new JSDOM(currentHTML);
    const currentDoc = currentDom.window.document;

    const currentBlock = currentDoc.querySelector('.bk-focus');

    const temp = fahrToCelc(currentBlock.querySelector('.h2').textContent);

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

    const currentDate = new Date().getTime();

    const forecastTemp = [...table.querySelectorAll('tr')].map((tr, i) => {
      const td = tr.querySelectorAll('td')[1].textContent;
      const [max, min] = td.split(' / ').map((temp) => parseInt(temp));

      return {
        max: fahrToCelc(max),
        min: fahrToCelc(min),
        average: fahrToCelc((min + max) / 2),
        date: formatDate(currentDate, i),
      };
    });

    return { data: { temp, city, pressure: hgToMbar(pressure), humidity, icon, forecastTemp }, error: '' };
  } catch (e) {
    console.log(e);
    return { data: null, error: e.message };
  }
}

module.exports = { getWeather };
