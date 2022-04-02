const crypto = require('crypto');

const getAddress = require('../request/other/getAddress');

const getLogin = require('../request/auth/getLogin');
const postLogin = require('../request/auth/postLogin');
const postLoginMethod = require('../request/auth/postLoginMethod');
const postLoginLinkVerify = require('../request/auth/postLoginLinkVerify');
const postLoginTokenVerify = require('../request/auth/postLoginTokenVerify');
const postStatusLogin = require('../request/auth/postStatusLogin');
const postLoginDone = require('../request/auth/postLoginDone');

const User = require('../models/User');

const { logReport, getCommands, setNewCookie, checkAccount, sleep } = require('../helpers')

module.exports = function (ctx) {
  let user = ctx.session;
  let commands = getCommands(ctx.message.text)

  return getAddress(user).then(async ({ statusCode, body, headers, curlInstance, curl }) => {
    curl.close()
    setNewCookie(user.userCookie, headers['set-cookie'])
    user.address = typeof body == 'string' ? JSON.parse(body) : body;
    if (!user.address.error) return ctx.reply('Anda Sudah Login')

    for (let command in commands) {
      command = command.toLowerCase()
      if (Object.hasOwnProperty.call(commands, command) && ['email', 'password'].includes(command) && commands[command]) {
        if (command == 'password') {
          user.userLoginInfo.metaPassword = commands[command];
          let md5pass = crypto.createHash('md5').update(commands[command]).digest('hex');
          commands[command] = crypto.createHash('sha256').update(md5pass).digest('hex');
        }
        user.userLoginInfo[command] = commands[command]
      }
    }

    await User.updateOne({
      teleBotId: process.env.BOT_ID,
      teleChatId: ctx.message.chat.id
    }, {
      userLoginInfo: user.userLoginInfo
    }).exec()

    if (!checkAccount(ctx)) return;

    await getLogin(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
      curl.close()
      setNewCookie(user.userCookie, headers['set-cookie'])
    }).catch((err) => logReport(new Error(err)));

    return async function tryLogin(msg) {
      if (msg) await ctx.reply(msg)
      return postLogin(user).then(async ({ statusCode, body, headers, curlInstance, curl }) => {
        curl.close()
        setNewCookie(user.userCookie, headers['set-cookie'])
        user.login = typeof body == 'string' ? JSON.parse(body) : body;

        switch (user.login.error) {
          case 1:
            return tryLogin('Ada Yang Error.. Sedang Mencoba Kembali..');
          case 2:
            return ctx.reply('Akun dan/atau password Anda salah, silakan coba lagi')
          case 98:
            await postLoginMethod(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
              curl.close()
              setNewCookie(user.userCookie, headers['set-cookie'])
              user.loginMethod = typeof body == 'string' ? JSON.parse(body) : body;
            }).catch((err) => logReport(new Error(err)));

            if (user.loginMethod.data.length == 0) {
              return ctx.reply('Maaf, kami tidak dapat memverifikasi log in kamu. Silakan hubungi Customer Service untuk bantuan.')
            }

            await postLoginLinkVerify(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
              curl.close()
              setNewCookie(user.userCookie, headers['set-cookie'])
              user.loginLinkVerify = typeof body == 'string' ? JSON.parse(body) : body;
            }).catch((err) => logReport(new Error(err)));

            if (user.loginLinkVerify.error && user.loginLinkVerify.error == 81900202) {
              return ctx.reply('Verifikasi gagal.. Kamu telah mencapai limit verifikasi melalui link otentikasi hari ini.')
            }

            ctx.reply('Silahkan Cek Notifikasi SMS dari Shopee di Handphone Anda')

            do {
              await postStatusLogin(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
                curl.close()
                setNewCookie(user.userCookie, headers['set-cookie'])
                user.loginStatus = typeof body == 'string' ? JSON.parse(body) : body;
              }).catch((err) => logReport(new Error(err)));

              if (user.loginStatus.data.link_status == 4) return ctx.reply('Login Anda Gagal Coba Beberapa Saat Lagi')

              await sleep(1000);
            } while (user.loginStatus.data.link_status != 2);

            await postLoginTokenVerify(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
              curl.close()
              setNewCookie(user.userCookie, headers['set-cookie'])
              user.loginTokenVerify = typeof body == 'string' ? JSON.parse(body) : body;
            }).catch((err) => logReport(new Error(err)));

            await postLoginDone(user).then(({ statusCode, body, headers, curlInstance, curl }) => {
              curl.close()
              setNewCookie(user.userCookie, headers['set-cookie'])
              user.loginDoneStatus = typeof body == 'string' ? JSON.parse(body) : body;
            }).catch((err) => logReport(new Error(err)));

            if (user.loginDoneStatus.data) {
              await ctx.reply('Login Berhasil')
            } else {
              await ctx.reply(`Login Gagal`)
              return logReport(new Error('Login Gagal'), 'Error')
            }

            break;

          default:
            await ctx.reply(`Auto Login Berhasil`)
        }

        return User.updateOne({
          teleBotId: process.env.BOT_ID,
          teleChatId: ctx.message.chat.id
        }, {
          userLoginInfo: user.userLoginInfo,
          userCookie: user.userCookie
        }).exec(async (err, res) => {
          if (err) return ctx.reply(`User Gagal Di Update`).then(() => logReport(new Error('User Gagal Di Update'), 'Error')).catch((err) => logReport(new Error(err)));
        })

      }).catch((err) => logReport(new Error(err)));
    }()

  }).catch((err) => logReport(new Error(err)));
}