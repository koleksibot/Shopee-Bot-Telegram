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
      'if-none-match-: 55b03-560c1be0a0e733dac9566cdc6d227463',
      'content-type: application/json',
      `x-csrftoken: ${user.userCookie.csrftoken}`,
      'origin: https://shopee.co.id',
      'sec-fetch-site: same-origin',
      'sec-fetch-mode: cors',
      'sec-fetch-dest: empty',
      `referer: https://shopee.co.id/cart?itemKeys=${user.config.itemid}.${user.config.modelid}.&shopId=${user.config.shopid}`,
      'accept-language: en-US,en;q=0.9',
      `cookie: ${curl.serializeCookie(user.userCookie)}`,
    ]).setBody(JSON.stringify({
      "selected_shop_order_ids": [{
        "shopid": user.config.shopid,
        "item_briefs": [{
          "itemid": user.config.itemid,
          "modelid": user.config.modelid,
          "item_group_id": user.selectedItem.item_group_id,
          "applied_promotion_id": user.config.promotionid,
          "offerid": user.selectedItem.offerid,
          "price": user.price,
          "quantity": user.config.quantity,
          "is_add_on_sub_item": user.selectedItem.is_add_on_sub_item,
          "add_on_deal_id": user.selectedItem.add_on_deal_id,
          "status": user.selectedItem.status,
          "cart_item_change_time": user.selectedItem.cart_item_change_time
        }],
        "shop_vouchers": []
      }],
      "platform_vouchers": [],
      "free_shipping_voucher_info": {
        "free_shipping_voucher_id": 0,
        "free_shipping_voucher_code": null
      },
      "use_coins": false
    })).post(`https://shopee.co.id/api/v4/cart/checkout`)
}