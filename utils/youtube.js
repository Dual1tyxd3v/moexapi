const EMBED_URL = 'https://www.youtube.com/embed/';

const getVideo = async (url) => {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.log(resp);
      return { data: [], error: resp.status.toString() };
    }
    const html = await resp.text();

    const object = html
      .split('script>')
      .filter((part) => part.includes('ytInitialData'))[0]
      .split('ytInitialData =')[1]
      .slice(0, -3)
      .replace('/\\"/g', '');
    const content = JSON.parse(object);

    const data = content.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.richGridRenderer.contents
      .slice(0, -1)
      .map((videoData) => {
        const title = videoData.richItemRenderer.content.videoRenderer.title.runs[0].text;
        const date = videoData.richItemRenderer.content.videoRenderer.publishedTimeText.simpleText;

        const videoId =
          videoData.richItemRenderer.content.videoRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url.split(
            '='
          )[1];
        const url = `${EMBED_URL}${videoId}`;

        return { title, date, url };
      });

    return { data, error: '' };
  } catch (e) {
    console.log(e);
    return { data: [], error: e.message };
  }
};

module.exports = { getVideo };
