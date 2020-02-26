require('dotenv').config()
const notes = require('./notes.js')
const Telegraf = require('telegraf')

//
const URL = process.env.URL || 'https://telegram-bot-run.herokuapp.com/';
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT)

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('modern', ({ reply }) => reply('Yo'))

bot.hears('add', (ctx) => {
    
})

bot.use((ctx, next) => {
    if (!ctx.message) return next(ctx);
    if (ctx.message.text == '/wipe') {
        ctx.session = {}
        return ctx.reply('session wiped').then(() => next(ctx))
    }

    if (ctx.message.text && ctx.message.text.includes("add")) {
        console.log('Message from user', ctx.chat.username, 'recieved:', ctx.message.text)
        var parts = ctx.message.text.split(" ")
        console.log(parts)
        if (parts.length > 1) {
            var distance = 0
            var duration = 0
            parts.forEach(element => {
                if (element.includes("km")) {
                    if (distance == 0) distance = parseFloat(element)
                }
                if (element.includes("m")) {
                    if (distance == 0) distance = parseFloat(element) / 1000
                }
                if (element.includes("h")) {
                    if (duration == 0) duration = parseFloat(element) * 60
                }
                if (element.includes("min")) {
                    if (duration == 0) duration = parseFloat(element)
                }
            });
            notes.add(ctx.chat.username, distance, duration)
        }
        const notesList = notes.loadNotes()
        return ctx.reply(notesList)
    }

//    return next(ctx)
})



bot.launch()