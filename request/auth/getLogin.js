module.exports = async function (user) {
  let curl = new user.Curl()

  return curl.setOpt(curl.libcurl.option.SSL_VERIFYPEER, false).setOpt(curl.libcurl.option.TCP_KEEPALIVE, true).setOpt(curl.libcurl.option.TIMEOUT, 2)
    .setHeaders([
      'authority: shopee.co.id',
      `user-agent: ${process.env.USER_AGENT}`,
      'x-api-source: pc',
      'accept: application/json',
      'x-shopee-language: id',
      'x-requested-with: XMLHttpRequest',
      'content-type: application/json',
      `x-csrftoken: ${user.userCookie.csrftoken}`,
      'origin: https://shopee.co.id',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      'referer: https://shopee.co.id',
      'accept-language: en-US,en;q=0.9'
    ]).get(`https://shopee.co.id/buyer/login`)
}