const psl = require('psl');

const User = require('../models/User');

const getItem = require('../helpers/getItem');

const { getCommands, checkAccount, objectSize, isValidURL, replaceMessage, extractRootDomain } = require('../helpers')

module.exports = async function (ctx) {
  let user = ctx.session
  user.commands = getCommands(ctx.message.text)
  if (objectSize(user.commands) < 1) return ctx.reply(`/start <code>url=https://shopee.co.id/Sebuah-Produk-Shop.....</code>`, { parse_mode: 'HTML' })

  if (user.commands['-stop']) {
    return User.updateOne({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id }, { queue: false }).exec()
  }

  await ctx.reply(`Memuat... <code>${user.commands.url}</code>`, { parse_mode: 'HTML' }).then((replyCtx) => {
    user.config = {
      message: {
        chatId: replyCtx.chat.id,
        msgId: replyCtx.message_id,
        inlineMsgId: replyCtx.inline_message_id,
        text: replyCtx.text
      }
    }
  })

  if (!checkAccount(ctx) || !isValidURL(user.commands.url)) return replaceMessage(ctx, user.config.message, 'Format Url Salah / Anda Belum Login')
  if (psl.get(extractRootDomain(user.commands.url)) != 'shopee.co.id') return replaceMessage(ctx, user.config.message, 'Bukan Url Dari Shopee')
  if (user.commands['-cod'] && user.commands['-shopeepay']) return replaceMessage(ctx, user.config.message, 'Silahkan Pilih Hanya Salah Satu Metode Pembayaran')

  if (user.queue) {
    return replaceMessage(ctx, user.config.message, 'Hanya Bisa Mendaftarkan 1 Produk Dalam Antrian!!')
  }

  return getItem(ctx);
}