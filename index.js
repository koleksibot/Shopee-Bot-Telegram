require('dotenv').config()

const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const chalk = require('chalk');

const User = require('./models/User');

const Curl = require('./helpers/curl')

const bot = new Telegraf(process.env.TOKEN);

const { logReport, generateString, ensureRole } = require('./helpers')

mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((res, err) => err ? console.error(chalk.red(err)) : console.log(chalk.green('MongoDB connection successful.')))
  .catch((err) => console.error(chalk.red(err)))

bot.use(session())

bot.telegram.getMe().then(async (botInfo) => {
  process.env.BOT_NAME = botInfo.first_name
  process.env.BOT_USERNAME = botInfo.username
  process.env.BOT_ID = parseInt(botInfo.id)

  await User.updateMany({ teleBotId: process.env.BOT_ID }, {
    queue: false,
    alarm: false
  }, async function (err, user, created) { if (err) return logReport(err) })

  await User.updateMany({ teleChatId: process.env.ADMIN_ID }, {
    userRole: 1
  }, async function (err, user, created) { if (err) return logReport(err) })

}).catch((err) => console.error(chalk.red(err)))

bot.use((ctx, next) => {
  if (!ctx.message.chat) return;
  return User.findOrCreate({ teleBotId: process.env.BOT_ID, teleChatId: ctx.message.chat.id }, {
    teleChatData: {
      id: ctx.message.chat.id,
      firstName: ctx.message.chat.first_name,
      lastName: ctx.message.chat.last_name,
      username: ctx.message.chat.username
    },
    userLoginInfo: { email: null },
    userCookie: { csrftoken: generateString(32) },
    userRole: 4,
    queue: false
  }, async function (err, user, created) {
    if (err) return logReport(new Error(err))
    if (created) logReport(`Akun Baru Terbuat`, 'Info')
    ctx.session = user
    ctx.session.Curl = Curl
    ctx.session.metaPayment = { channels: [{ name_label: "label_shopee_wallet_v2", version: 2, spm_channel_id: 8001400, be_channel_id: 80030, name: "ShopeePay", enabled: !0, channel_id: 8001400 }, { name_label: "label_offline_bank_transfer", version: 2, spm_channel_id: 8005200, be_channel_id: 80060, name: "Transfer Bank", enabled: !0, channel_id: 8005200, banks: [{ bank_name: "Bank BCA (Dicek Otomatis)", option_info: "89052001", be_channel_id: 80061, enabled: !0 }, { bank_name: "Bank Mandiri(Dicek Otomatis)", option_info: "89052002", enabled: !0, be_channel_id: 80062 }, { bank_name: "Bank BNI (Dicek Otomatis)", option_info: "89052003", enabled: !0, be_channel_id: 80063 }, { bank_name: "Bank BRI (Dicek Otomatis)", option_info: "89052004", be_channel_id: 80064, enabled: !0 }, { bank_name: "Bank Syariah Indonesia (BSI) (Dicek Otomatis)", option_info: "89052005", be_channel_id: 80065, enabled: !0 }, { bank_name: "Bank Permata (Dicek Otomatis)", be_channel_id: 80066, enabled: !0, option_info: "89052006" }] }, { channelid: 89e3, name_label: "label_cod", version: 1, spm_channel_id: 0, be_channel_id: 89e3, name: "COD (Bayar di Tempat)", enabled: !0 }] }
    if (process.env.NODE_ENV == 'development' && !ensureRole(ctx, true)) {
      return ctx.reply(`Bot Sedang Maintenance, Silahkan Contact @edosulai`).then(() => logReport(`${ctx.session.teleChatId} Mencoba Akses BOT`, 'Info'))
    }
    return next(ctx)
  })
})

bot.start(require('./command/start'))
bot.command('login', require('./command/login'))

bot.catch((err, ctx) => logReport(new Error(err)))

bot.launch()