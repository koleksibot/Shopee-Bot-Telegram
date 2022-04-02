module.exports = async function (user) {
  let curl = new user.Curl()

  return curl.setOpt(curl.libcurl.option.SSL_VERIFYPEER, false).setOpt(curl.libcurl.option.TCP_KEEPALIVE, true).setOpt(curl.libcurl.option.TIMEOUT, 2)
    .setHeaders([
      'authority: shopee.co.id',
      'pragma: no-cache',
      'cache-control: no-cache',
      `user-agent: ${process.env.USER_AGENT}`,
      'x-api-source: pc',
      'accept: application/json',
      'x-shopee-language: id',
      'x-requested-with: XMLHttpRequest',
      'if-none-match-: 55b03-35060d583b4ca3a7a03734efbaa78111',
      'content-type: application/json',
      `x-csrftoken: ${user.userCookie.csrftoken}`,
      'origin: https://shopee.co.id',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      'referer: https://shopee.co.id/verify/ivs?is_initial=true',
      'accept-language: id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      `cookie: ${curl.serializeCookie(user.userCookie)}`
    ]).setBody(JSON.stringify({
      event: 1,
      u_token: user.login.data.ivs_token
    })).post(`https://shopee.co.id/api/v4/anti_fraud/ivs/methods`)
}