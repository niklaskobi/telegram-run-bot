require("dotenv").config();
const chalk = require("chalk");
const notes = require("./notes.js");
const Telegraf = require("telegraf");
const extra = require("telegraf/extra");
const markup = extra.markdown();
var table = require("markdown-table");

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
const MAX_CHARS_NAME = 5;

// bot commands ========================================================================
bot.start(ctx => ctx.reply("Welcome"));
bot.help(ctx => ctx.reply("Send me a sticker"));
bot.on("sticker", ctx => ctx.reply("👍"));
bot.hears("hi", ctx => ctx.reply("Hey there"));
bot.command("modern", ({ reply }) => reply("Yo"));

// test ===============================================================================
bot.hears("test", ctx =>
  bot.telegram.sendMessage((chatid = ctx.from.id), "*me work!work!*", markup)
);

// stats: me =========================================================================
bot.command("me", ctx => {
  let username = ctx.chat.username;
  let tableData = stats1UserRows(username);
  let tableOptions = { delimiterStart: false, delimiterEnd: false };
  let tableAsStr = table(tableData, tableOptions);
  let titleText = `stats *${prepairStrForMarkdown(username)}*:\n`;
  let tableNoHeader = tableAsStr.substring(
    tableAsStr.indexOf("km"),
    tableAsStr.length
  ); //remove everthing from the table until the first row
  bot.telegram.sendMessage(
    (chatid = ctx.from.id),
    (text = titleText.concat(addMarkdownEvenWidth(tableNoHeader))),
    markup
  );
});

// history =========================================================================
bot.command("history", ctx => {
  let username = ctx.chat.username;

  // get amount of runs
  let runsAmount = 0;
  if (ctx.message.text.split(" ").length == 2) {
    let tmp = ctx.message.text.split(" ")[1];
    console.log(tmp);
    console.log(typeof tmp);
    if (!isNaN(tmp)) runsAmount = parseInt(tmp);
  }

  let historyData = history1UserRow(ctx.chat.username, runsAmount);
  let tableOptions = { delimiterStart: false, delimiterEnd: false };
  let tableAsStr = table(historyData, tableOptions);

  let titleText = `history *${prepairStrForMarkdown(username)}*`;
  if (runsAmount == 0) {
    titleText += `, all runs:\n`;
  } else {
    titleText += `, last ${runsAmount} runs:\n`;
  }

  bot.telegram.sendMessage(
    (chatid = ctx.from.id),
    (text = titleText.concat(addMarkdownEvenWidth(tableAsStr))),
    markup
  );
});

// stats: all =========================================================================
bot.command("all", ctx => {
  let stats = statsAll();
  console.log(stats);

  let tableData = statsAllToRows();
  let tableOptions = { delimiterStart: false, delimiterEnd: false };
  let tableAsStr = table(tableData, tableOptions);

  bot.telegram.sendMessage(
    (chatid = ctx.from.id),
    (text = addMarkdownEvenWidth(tableAsStr)),
    markup
  );
});

// functions =========================================================================
const history1UserRow = (username, runsAmount) => {
  let runs = notes.getLastNRuns(runsAmount, username);
  let rowHeader = ["date", "km", "h", "m/km"];
  let rows = [rowHeader];
  console.log(JSON.stringify(runs));
  runs.forEach(runStats => {
    let date = new Date(runStats.date);
    let row = [
      date.getDate() + "." + (date.getMonth() + 1),
      runStats.distance,
      runStats.duration,
      runStats.pace
    ];
    rows.push(row);
  });
  return rows;
};

const statsAllToRows = () => {
  let rowHeader = ["name", "km", "h", "m/km"];
  let rows = [rowHeader];
  let users = notes.getAllUsers();
  let outputStr = "";
  users.forEach(username => {
    let stats = notes.getAllStats(username);
    if (!stats.err) {
      let row = [prepairStrForMarkdown(username.substring(0, MAX_CHARS_NAME))];
      row.push(roundFloat(stats.distance));
      row.push(roundFloat(stats.duration / 60));
      if (stats.distance > 0) row.push(roundFloat(stats.pace));
      rows.push(row);
    }
  });
  if (users.length > 0) return rows;
  else return "no data";
};

const stats1UserRows = username => {
  const stats = notes.getLastXStats(STATSDAYS, username);
  if (stats) {
    let rows = [["stat", "value"]];
    rows.push(["km", `${stats.distance}`]);
    rows.push([`h`, `${roundFloat(stats.duration / 60)}`]);
    if (stats.distance > 0) {
      let pace = notes.getPace(stats.distance, stats.duration);
      rows.push([`km/min`, `${Number(pace.toFixed(DECIMALSAFTERDOT))}`]);
    }
    rows.push([`runs`, `${notes.getNrOfRuns(username)}`]);
    console.log(JSON.stringify(rows));
    return rows;
  } else {
    return { error: "No runs saved" };
  }
};

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
  else return { error: "no data" };
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
      let replyStr = `run added.\n`;
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

const prepairStrForMarkdown = input => {
  let result = input;
  result = result.replace("*", "*");
  result = result.replace("_", "_");
  result = result.replace("`", "`");
  return result;
};

const addMarkdownEvenWidth = input => "```\n".concat(input).concat("\n```");

bot.launch();
