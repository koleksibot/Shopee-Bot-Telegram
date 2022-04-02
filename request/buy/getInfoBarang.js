module.exports = async function (user) {
  let curl = new user.Curl()

  return curl.setOpt(curl.libcurl.option.SSL_VERIFYPEER, false).setOpt(curl.libcurl.option.TCP_KEEPALIVE, true).setOpt(curl.libcurl.option.TIMEOUT, 2)
    .setHeaders([
      'authority: shopee.co.id',
      'pragma: no-cache',
      'cache-control: no-cache',
      'x-shopee-language: id',
      'x-requested-with: XMLHttpRequest',
      'if-none-match-: 55b03-39155c622be48dcc9e152107052ce172',
      `user-agent: ${process.env.USER_AGENT}`,
      'x-api-source: pc',
      'accept: */*',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      `referer: ${user.config.url}`,
      'accept-language: en-US,en;q=0.9',
      `cookie: ${curl.serializeCookie(user.userCookie)}`
    ]).get(`https://shopee.co.id/api/v2/item/get?itemid=${user.config.itemid}&shopid=${user.config.shopid}`)
}