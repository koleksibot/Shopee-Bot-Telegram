const postBuy = require('../request/buy/postBuy');
const postUpdateKeranjang = require('../request/buy/postUpdateKeranjang');

const { logReport, setNewCookie, timeConverter } = require('../helpers')

module.exports = async function (ctx) {
  let user = ctx.session;

  return postBuy(user).then(async ({ statusCode, body, headers, curlInstance, curl, err }) => {
    if (err) {
      await postUpdateKeranjang(user, 2).then(({ statusCode, body, headers, curlInstance, curl }) => {
        setNewCookie(user.userCookie, headers['set-cookie'])
        curl.close()
      }).catch((err) => logReport(new Error(err)));

      return err;
    }

    setNewCookie(user.userCookie, headers['set-cookie'])
    user.order = typeof body == 'string' ? JSON.parse(body) : body;
    user.order.time = Math.floor(curlInstance.getInfo('TOTAL_TIME') * 1000);
    curl.close()

    user.info = `\n\nMetode Pembayaran : <b>${user.payment.msg}</b>`
    user.info += `\n\nBot Start : <b>${timeConverter(user.config.start, { usemilis: true })}</b>`
    user.info += `\nCheckout : <b>${timeConverter(user.config.checkout, { usemilis: true })}</b>`
    user.info += `\nBot End : <b>${timeConverter(Date.now(), { usemilis: true })}</b>`

    if (user.order.error) {
      user.info += `\n\n<i>Gagal Melakukan Payment Barang <b>(${user.selectedItem.name.replace(/<[^>]*>?/gm, "")})</b>\n${user.order.error_msg} [${user.order.error}]</i>`

      await postUpdateKeranjang(user, 2).then(({ statusCode, body, headers, curlInstance, curl }) => {
        curl.close()
        setNewCookie(user.userCookie, headers['set-cookie'])
        user.info += `\n\nBarang <b>(${user.selectedItem.name.replace(/<[^>]*>?/gm, "")})</b> Telah Telah Di Hapus Dari Keranjang`
      }).catch((err) => logReport(new Error(err)));

    } else {
      user.config.success = true
      user.info += `\n\n<i>Barang <b>(${user.selectedItem.name.replace(/<[^>]*>?/gm, "")})</b> Berhasil Di Pesan</i>`
    }

    return user.info
  }).catch((err) => logReport(new Error(err)));
}