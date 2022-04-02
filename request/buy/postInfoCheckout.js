module.exports = async function (user) {
  let curl = new user.Curl()

  return curl.setOpt(curl.libcurl.option.SSL_VERIFYPEER, false).setOpt(curl.libcurl.option.TCP_KEEPALIVE, true).setOpt(curl.libcurl.option.TIMEOUT, 2)
    .setHeaders([
      'authority: shopee.co.id',
      'pragma: no-cache',
      'cache-control: no-cache',
      'x-cv-id: 9',
      `user-agent: ${process.env.USER_AGENT}`,
      'content-type: application/json',
      'accept: application/json',
      'x-shopee-language: id',
      'x-requested-with: XMLHttpRequest',
      'if-none-match-: 55b03-dec72446a290ee789f4625e516fbd51c',
      'x-api-source: pc',
      `x-csrftoken: ${user.userCookie.csrftoken}`,
      'origin: https://shopee.co.id',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      'referer: https://shopee.co.id/checkout',
      'accept-language: en-US,en;q=0.9',
      `cookie: ${curl.serializeCookie(user.userCookie)}`
    ]).setBody(JSON.stringify({
      "shoporders": [{
        "shop": { "shopid": user.config.shopid },
        "items": [{
          "itemid": user.config.itemid,
          "modelid": user.config.modelid,
          "add_on_deal_id": user.selectedItem.add_on_deal_id,
          "is_add_on_sub_item": user.selectedItem.is_add_on_sub_item,
          "item_group_id": user.selectedItem.item_group_id,
          "quantity": user.config.quantity
        }],
        "logistics": { "recommended_channelids": null },
        "buyer_address_data": {},
        "selected_preferred_delivery_time_slot_id": null
      }]
    })).post(`https://shopee.co.id/api/v2/checkout/get`)
}