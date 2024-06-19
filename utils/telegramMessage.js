const MESSAGE_URL =
  'https://api.telegram.org/bot5910914438:AAGnFKdoICio2rw007B1IItl7ovDFSpOpcs/sendMessage?chat_id=968980307&parse_mode=html&text=';

  async function sendMessage(msg) {
  try {
    const resp = await fetch(`${MESSAGE_URL}${msg}`);

    return { isSuccess: resp.ok ? true : false, message: '' };
  } catch (e) {
    console.log(e);
    return { isSuccess: false, message: e.message };
  }
}

module.exports = { sendMessage };
