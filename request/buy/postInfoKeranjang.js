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
      'if-none-match-: 55b03-1b0fd928d8c948f4ab007af348d7551d',
      'content-type: application/json',
      `x-csrftoken: ${user.userCookie.csrftoken}`,
      'origin: https://shopee.co.id',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      `referer: https://shopee.co.id/cart?itemKeys=${user.config.itemid}.${user.config.modelid}.&shopId=${user.config.shopid}`,
      'accept-language: en-US,en;q=0.9',
      `cookie: ${curl.serializeCookie(user.userCookie)}`,
    ]).setBody(JSON.stringify({ "pre_selected_item_list": [] })).post(`https://shopee.co.id/api/v4/cart/get`)
}