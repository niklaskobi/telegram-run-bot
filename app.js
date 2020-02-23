require('dotenv').config()

const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('modern', ({ reply }) => reply('Yo'))


bot.hears('add2', (ctx) => {
    console.log('Message from user', ctx.chat.username, 'recieved:', ctx.message.text)
    //var parts = ctx.message.text.split(" ")
    //console.log(parts)
    ctx.reply('asdas')
})


bot.use((ctx, next) => {    
    console.log('Message from user', ctx.chat.username, 'recieved:', ctx.message.text)
    if (ctx.message.text == '/wipe') {
        ctx.session = {}
        return ctx.reply('session wiped').then(() => next(ctx))
    }
    if (ctx.message.text.includes("add")) {
        console.log('Message from user', ctx.chat.username, 'recieved:', ctx.message.text)
        var parts = ctx.message.text.split(" ")
        console.log(parts)
        return ctx.reply('asdas')
    }

    return next(ctx)
})



bot.launch()