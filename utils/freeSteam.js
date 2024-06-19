const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const FREE_STEAM_URL = 'https://freesteam.ru/';

const getFreeSteam = async () => {
  try {
    const response = await fetch(FREE_STEAM_URL);
    if (!response.ok) {
      console.log(response);
      return { data: null, error: `Cant fetch - ${FREE_STEAM_URL}` };
    }

    const html = await response.text();
    const data = parseFreeSteam(html);

    return { data, error: '' };
  } catch (e) {
    return { data: null, error: e.message };
  }
};

const parseFreeSteam = (html) => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const activePosts = [...doc.querySelectorAll('.post-thumb')].filter((post) =>
    post.querySelector('.entry-cats').textContent.includes('Активная')
  );

  return activePosts.map((post) => {
    const img = post.querySelector('img').getAttribute('data-srcset').split(' ')[0];
    const place = post.querySelector('.entry-cats').querySelector('a').textContent;
    const url = post.querySelector('a').href;

    return { img, place, url };
  });
};

module.exports = { getFreeSteam };
