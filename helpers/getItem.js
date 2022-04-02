const getAddress = require('../request/other/getAddress');
const getInfoBarang = require('../request/buy/getInfoBarang');

const User = require('../models/User');

const getCart = require('./getCart');

const { logReport, setNewCookie, timeConverter, parseShopeeUrl, paymentMethod, sendMessage, replaceMessage } = require('../helpers')

module.exports = async function (ctx) {
  let user = ctx.session

  let { itemid, shopid, err } = parseShopeeUrl(user.commands.url)
  if (err) return sendMessage(ctx, err)
  if (user.queue.length > 0) return ctx.telegram.deleteMessage(user.config.message.chatId, user.config.message.msgId)

  user.config = {
    ...user.config, ...{
      itemid: itemid,
      shopid: shopid,
      quantity: parseInt(user.commands.qty) || 1,
      url: user.commands.url,
      payment: {
        cod: user.commands['-cod'] || false,
        shopeePay: user.commands['-shopeepay'] || false,
        transferBank: function (tansferPrioritys) {
          if (tansferPrioritys.includes(user.commands.transfer)) {
            return tansferPrioritys.sort((index, transfer) => index == user.commands.transfer ? -1 : transfer == user.commands.transfer ? 1 : 0);
          } else {
            return tansferPrioritys
          }
        }(['bni', 'bri', 'bca', 'mandiri', 'bsi', 'permata'])
      },
      skiptimer: user.commands['-skiptimer'] || false,
      success: false
    }
  }

  user.payment = paymentMethod(user, user.metaPayment.channels)

  return getAddress(user).then(async ({ statusCode, body, headers, curlInstance, curl }) => {
    curl.close()
    setNewCookie(user.userCookie, headers['set-cookie'])
    user.address = typeof body == 'string' ? JSON.parse(body) : body;
    if (user.address.error) return replaceMessage(ctx, user.config.message, 'Sesi Anda Sudah Habis Silahkan Login Kembali')
    user.address = function (addresses) {
      for (const address of addresses) {
        return address
      }
    }(user.address.addresses)

    await User.updateOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id }, { queue: true }).exec()

    return getInfoBarang(user).then(async ({ statusCode, body, headers, curlInstance, curl }) => {
      setNewCookie(user.userCookie, headers['set-cookie'])
      let chunk = typeof body == 'string' ? JSON.parse(body) : body;
      if (chunk.error == null) {
        user.infoBarang = chunk;

        user.config.promotionid = function (barang) {
          if (barang.item.flash_sale) {
            return barang.item.flash_sale.promotionid
          }

          if (barang.item.upcoming_flash_sale) {
            return barang.item.upcoming_flash_sale.promotionid
          }

          return 0
        }(user.infoBarang)

        user.config.modelid = function (barang) {
          for (const model of barang.item.models) {
            if (!barang.item.flash_sale) break;
            if (model.stock < 1 || model.price_stocks.length < 1) continue
            for (const stock of model.price_stocks) {
              if (user.config.promotionid == stock.promotion_id) return stock.model_id
            }
          }

          for (const model of barang.item.models) {
            if (model.stock < 1 || model.price_stocks.length < 1) continue
            return model.price_stocks[0].model_id
          }

          for (const model of barang.item.models) {
            if (model.stock < 1) continue
            return model.modelid
          }

          return null
        }(user.infoBarang)

        if (!user.config.modelid) {
          User.updateOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id }, {
            userCookie: user.userCookie,
            queue: false
          }).exec()
          return replaceMessage(ctx, user.config.message, `Semua Stok Barang Sudah Habis`)
        }

        do {
          if (await User.findOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id, queue: false })) {
            return replaceMessage(ctx, user.config.message, `Timer${user.infoBarang ? ` Untuk Barang ${user.infoBarang.item.name.replace(/<[^>]*>?/gm, "")}` : ''} - ${user.payment.msg} - Sudah Di Matikan`)
          }

          if (!user.infoBarang.item.upcoming_flash_sale || user.config.skiptimer || (parseInt(user.infoBarang.item.upcoming_flash_sale.start_time) * 1000) < Date.now() + 3000) break;

          await replaceMessage(ctx, user.config.message, timeConverter(Date.now() - (parseInt(user.infoBarang.item.upcoming_flash_sale.start_time) * 1000), { countdown: true }) + ` - ${user.infoBarang.item.name.replace(/<[^>]*>?/gm, "")} - ${user.payment.msg}`)

          await sleep(1000 - (Date.now() - user.config.start))

        } while (!user.config.skiptimer)

        if (await User.findOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id, queue: false })) {
          return replaceMessage(ctx, user.config.message, `Timer${user.infoBarang ? ` Untuk Barang ${user.infoBarang.item.name.replace(/<[^>]*>?/gm, "")}` : ''} - ${user.payment.msg} - Sudah Di Matikan`)
        }

        await replaceMessage(ctx, user.config.message, `Mulai Membeli Barang ${user.infoBarang ? `<code>${user.infoBarang.item.name.replace(/<[^>]*>?/gm, "")}</code>` : ''}`, false)
        while ((user.config.end > Date.now()) || ((Date.now() % 1000).toFixed(0) > 100)) continue;

        let info = await getCart(ctx)
        if (typeof info == 'string') await replaceMessage(ctx, user.config.message, info, false)

        return User.updateOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id }, {
          userCookie: user.userCookie,
          queue: false
        }).exec()

      }
      curl.close();
    }).catch((err) => logReport(new Error(err)));

  }).catch((err) => logReport(new Error(err)));
}