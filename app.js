require("dotenv").config();
const chalk = require("chalk");
const notes = require("./notes.js");
const Telegraf = require("telegraf");

// server variables
const API_TOKEN = process.env.API_TOKEN || "";
const URL = process.env.URL || "https://telegram-bot-run.herokuapp.com/";
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);

// webhooks
bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);

// app variables
const STATSDAYS = 10;
const DECIMALSAFTERDOT = 1;

// bot commands
bot.start(ctx => ctx.reply("Welcome"));
bot.help(ctx => ctx.reply("Send me a sticker"));
bot.on("sticker", ctx => ctx.reply("👍"));
bot.hears("hi", ctx => ctx.reply("Hey there"));
bot.command("modern", ({ reply }) => reply("Yo"));

// stats
bot.command("stats", ctx => {
  ctx.reply(statsToStr(ctx.chat.username));
});

// stats all
bot.command("statsall", ctx => {
  ctx.reply(statsAll());
});

const statsAll = () => {
  let users = notes.getAllUsers();
  let outputStr = "";
  users.forEach(username => {
    let stats = notes.getAllStats(username);
    console.log(chalk.yellow(JSON.stringify(stats)));
    if (!stats.err) {
      outputStr += username + ": ";
      outputStr += stats.distance + "km, ";
      outputStr += roundFloat(stats.duration / 60) + "h, ";
      outputStr += roundFloat(stats.pace) + "km/min, ";
      outputStr += stats.runs + " runs";
    }
  });
  if (outputStr.length > 0) return outputStr;
  else return "no data";
};

const statsToStr = username => {
  const stats = notes.getLastXStats(STATSDAYS, username);
  if (stats) {
    let runsCnt = notes.getNrOfRuns(username);
    replyStr = `Stats for \'${username}\':\n`;
    replyStr += `Distance: ${stats.distance}km\n`;
    replyStr += `Duration: ${stats.duration}min\n`;
    let pace = notes.getPace(stats.distance, stats.duration);
    if (stats.distance != 0) {
      replyStr += `Pace: ${Number(pace.toFixed(DECIMALSAFTERDOT))}km/min\n`;
    }
    replyStr += `Runs: ${runsCnt}`;
    return replyStr;
  } else {
    return "No runs saved";
  }
};

const roundFloat = x => Number(x.toFixed(DECIMALSAFTERDOT));

// delete all runs
bot.command("deleteall", ctx => {
  const deleted = notes.deleteAllStats(ctx.chat.username);
  if (deleted) ctx.reply(`Removed all stats for user ${ctx.chat.username}`);
  else ctx.reply(`No stats for user ${ctx.chat.username} found!`);
});

// add run
bot.command("add", ctx => {
  //ADD
  if (ctx.message.text && ctx.message.text.includes("add")) {
    let pace;
    let paceCompare;
    let statsNew;
    let statsOld;
    let added = false;
    console.log(
      "Message from user",
      ctx.chat.username,
      "recieved:",
      ctx.message.text
    );
    var parts = ctx.message.text.split(" ");
    console.log(parts);
    if (parts.length > 1) {
      var distance = 0;
      var duration = 0;
      parts.forEach(element => {
        if (element.includes("km")) {
          if (distance == 0) distance = parseFloat(element);
        }
        if (element.includes("m")) {
          if (distance == 0) distance = parseFloat(element) / 1000;
        }
        if (element.includes("h")) {
          if (duration == 0) duration = parseFloat(element) * 60;
        }
        if (element.includes("min")) {
          if (duration == 0) duration = parseFloat(element);
        }
      });
      if (distance != 0 && duration != 0) {
        statsOld = notes.getLastXStats(STATSDAYS, ctx.chat.username);
        notes.add(ctx.chat.username, distance, duration);
        statsNew = notes.getLastXStats(STATSDAYS, ctx.chat.username);
        pace = notes.getPace(distance, duration);
        added = true;
      }
    }
    if (added) {
      if (statsOld) {
        console.log("compare");
        paceCompare = (1 - statsOld.pace / pace) * 100;
      }
      let replyStr = `Run added.\n`;
      replyStr += `Distance: ${statsNew.distance}km\n`;
      replyStr += `Duration: ${statsNew.duration}min\n`;
      replyStr += `Pace(last run):\n${Number(pace.toFixed(1))}km/min`;
      if (statsOld) {
        if (paceCompare > 0)
          replyStr += ` (+${Number(paceCompare.toFixed(DECIMALSAFTERDOT))}%)`;
        else replyStr += ` (${Number(paceCompare.toFixed(DECIMALSAFTERDOT))}%)`;
      }

      return ctx.reply(replyStr);
    } else {
      return ctx.reply(`Invalid input format`);
    }
  }
});

bot.use((ctx, next) => {
  if (!ctx.message) return next(ctx);
  if (ctx.message.text == "/wipe") {
    ctx.session = {};
    return ctx.reply("session wiped").then(() => next(ctx));
  }
});

bot.launch();
