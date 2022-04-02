module.exports = async function (user, action) {
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
      'if-none-match-: 55b03-90fa84b0e0960216076d2bb09f6288da',
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
      "action_type": action,
      "updated_shop_order_ids": [{
        "shopid": user.config.shopid,
        "item_briefs": [{
          "shopid": user.config.shopid,
          "itemid": user.config.itemid,
          "modelid": user.config.modelid,
          "item_group_id": user.selectedItem.item_group_id,
          "add_on_deal_id": user.selectedItem.add_on_deal_id,
          "is_add_on_sub_item": user.selectedItem.is_add_on_sub_item,
          "quantity": user.config.quantity,
          "old_modelid": null,
          "old_quantity": user.config.quantity,
          "checkout": true,
          "applied_promotion_id": user.config.promotionid,
          "price": user.price
        }]
      }],
      "selected_shop_order_ids": [{
        "shopid": user.config.shopid,
        "item_briefs": function () {
          return action == 2 ? [] : [{
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
          }]
        }(),
        "addin_time": Math.floor(Date.now() / 1000),
        "auto_apply": true,
        "shop_vouchers": []
      }],
      "promotion_data": {
        "use_coins": false,
        "platform_vouchers": [],
        "free_shipping_voucher_info": {
          "free_shipping_voucher_id": 0,
          "free_shipping_voucher_code": null
        }
      },
      "pre_select": false
    })).post(`https://shopee.co.id/api/v4/cart/update`)
}