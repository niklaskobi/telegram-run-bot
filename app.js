require("dotenv").config();
const chalk = require("chalk");
const notes = require("./notes.js");
const Telegraf = require("telegraf");
const extra = require("telegraf/extra");
const markup = extra.markdown();
var table = require("markdown-table");

// server variables
const API_TOKEN = process.env.API_TOKEN || "";
//const URL = process.env.URL || "https://telegram-bot-run.herokuapp.com/";
const PORT = process.env.PORT || 30000;
const bot = new Telegraf(process.env.BOT_TOKEN);

var preventSleep = true;

// webhooks
//bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
//bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);

// app variables
const STATSDAYS = 10;
const DECIMALSAFTERDOT = 1;
const MAX_CHARS_NAME = 5;
let tableOptions = {
  delimiterStart: false,
  delimiterEnd: false,
  padding: false
};

// bot commands ========================================================================
bot.start(ctx => ctx.reply("Welcome"));
bot.help(ctx => ctx.reply("Send me a sticker"));
bot.on("sticker", ctx => ctx.reply("👍"));
bot.hears("Hi", ctx => ctx.reply("Hey there"));
bot.command("modern", ({ reply }) => reply("Yo"));

// test ===============================================================================
bot.hears("test", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*work! work!*", markup);
});

// test ===============================================================================
bot.command("json", ctx => {
  let logs = notes.loadNotes();
  if (logs.length > 0) {
    console.log(JSON.stringify(logs));
    bot.telegram.sendMessage(ctx.chat.id, JSON.stringify(logs, null, 2));
  } else {
    console.log("no file");
    bot.telegram.sendMessage(ctx.chat.id, "no file", markup);
  }
});

// stats: me =========================================================================
bot.command("me", ctx => {
  let username = getUserName(ctx);

  // get amount of runs
  let runsAmount = 0;
  if (ctx.message.text.split(" ").length == 2) {
    let tmp = ctx.message.text.split(" ")[1];
    if (!isNaN(tmp)) runsAmount = parseInt(tmp);
  }

  // build table
  let tableData = stats1UserRows(username, runsAmount);
  let tableAsStr = table(tableData, tableOptions);

  // build title and header
  let titleText = `stats *${prepairStrForMarkdown(username)}*`;
  if (runsAmount == 0) titleText += `, all runs:\n`;
  else titleText += `, last ${runsAmount} runs:\n`;
  //remove everthing from the table until the first row
  let tableNoHeader = tableAsStr.substring(
    tableAsStr.indexOf("km"),
    tableAsStr.length
  );

  if (tableData.error) sendSpecMsg(ctx, tableData.error);
  else {
    sendEvenWidthMsg(ctx, titleText, tableAsStr);
  }
});

// prevent from sleep =========================================================================
bot.command("work", ctx => {
  let username = getUserName(ctx);
  console.log(chalk.blue(JSON.stringify(ctx)));
  sendSpecMsg(ctx, "ok, i work then");
});

// history =========================================================================
bot.command("history", ctx => {
  let username = getUserName(ctx);

  // get amount of runs
  let runsAmount = 0;
  if (ctx.message.text.split(" ").length == 2) {
    let tmp = ctx.message.text.split(" ")[1];
    if (!isNaN(tmp)) runsAmount = parseInt(tmp);
  }

  // build table
  let historyData = history1UserRow(username, runsAmount);
  let tableAsStr = table(historyData, tableOptions);

  // title
  let titleText = `history *${prepairStrForMarkdown(username)}*`;
  if (runsAmount == 0) titleText += `, all runs:\n`;
  else titleText += `, last ${runsAmount} runs:\n`;

  if (historyData.error) sendSpecMsg(ctx, historyData.error);
  else sendEvenWidthMsg(ctx, titleText, tableAsStr);
});

// stats: all =========================================================================
bot.command("all", ctx => {
  let tableData = statsAllToRows();
  let tableAsStr = table(tableData, tableOptions);

  if (tableData.error) sendSpecMsg(ctx, tableData.error);
  else sendEvenWidthMsg(ctx, "", tableAsStr);
});

// delete index or user =======================================================================
bot.command("delete", ctx => {
  let username = getUserName(ctx);
  console.log(`msg from user: ${username}: ${ctx.message.text}`);

  // get amount of runs
  let index = 0;
  let usernameToDelete = "";
  let password = "";
  if (ctx.message.text.split(" ").length == 2) {
    let tmp = ctx.message.text.split(" ")[1];
    if (!isNaN(tmp)) index = parseInt(tmp);
  }

  if (ctx.message.text.split(" ").length == 3) {
    usernameToDelete = ctx.message.text.split(" ")[1];
    password = ctx.message.text.split(" ")[2];
  }

  if (password == "123") {
    const deleted = notes.deleteAllStats(usernameToDelete);
    if (deleted)
      sendSpecMsg(ctx, `Removed all stats for user ${usernameToDelete}`);
    else sendSpecMsg(ctx, `No stats for user ${usernameToDelete} found!`);
  } else if (index == 0) sendSpecMsg(ctx, "Usage: /delete <index>");
  else {
    let result = notes.deleteNthRun(username, index);
    if (result.error) sendSpecMsg(ctx, result.error);
    else sendSpecMsg(ctx, result.success);
  }
});

// delete all runs ====================================================================
bot.command("deleteall", ctx => {
  let username = getUserName(ctx);
  console.log(`msg from user: ${username}: ${ctx.message.text}`);
  const deleted = notes.deleteAllStats(username);
  if (deleted) sendSpecMsg(ctx, `Removed all stats for user ${username}`);
  else sendSpecMsg(ctx, `No stats for user ${username} found!`);
});

// functions =========================================================================
const sendSpecMsg = (ctx, msg) =>
  bot.telegram.sendMessage(
    (chatid = ctx.chat.id),
    (text = "`" + msg + "`"),
    markup
  );

const sendEvenWidthMsg = (ctx, title, msg) =>
  bot.telegram.sendMessage(
    (chatid = ctx.chat.id),
    (text = title + addMarkdownEvenWidth(msg)),
    markup
  );

const history1UserRow = (username, runsAmount) => {
  let runs = notes.getLastNRuns(runsAmount, username);
  let rowHeader = ["date", "km", "min", "⌀"];
  let rows = [rowHeader];

  if (!runs) return { error: "no data" };

  runs.forEach(runStats => {
    let row = [
      dateToStr(new Date(runStats.date)),
      runStats.distance,
      runStats.duration,
      roundFloat(runStats.pace, 2)
    ];
    rows.push(row);
  });
  return rows;
};

const dateToStr = date => date.getDate() + "." + (date.getMonth() + 1);
const minToHours = (min, ad) => Number((min / 60).toFixed(ad));

const statsAllToRows = () => {
  let rowHeader = ["name", "km", "h", "⌀"];
  let rows = [rowHeader];
  let users = notes.getAllUsers();
  let outputStr = "";

  if (users.length == 0) return { error: "no data" };

  users.forEach(username => {
    let stats = notes.getAllStats(username);
    if (!stats.err) {
      let row = [prepairStrForMarkdown(username.substring(0, MAX_CHARS_NAME))];
      row.push(roundFloat(stats.distance, 1));
      row.push(minToHours(stats.duration, 1));
      if (stats.distance > 0) row.push(roundFloat(stats.pace, 1));
      rows.push(row);
    }
  });
  if (users.length > 0) return rows;
  else return "no data";
};

const stats1UserRows = (username, runsAmount) => {
  const stats = notes.getLastXStats(runsAmount, username);
  if (stats.error) return { error: stats.error };
  else {
    let rows = [["stat", "value"]];
    rows.push(["km", `${roundFloat(stats.distance, 2)}`]);
    rows.push([`h`, `${minToHours(stats.duration, 2)}`]);
    if (stats.distance > 0) rows.push(["⌀", roundFloat(stats.pace, 2)]);
    rows.push([`runs`, `${notes.getNrOfRuns(username)}`]);
    return rows;
  }
};

const getUserName = ctx => {
  if (ctx.from.username) return ctx.from.username;
  else if (ctx.from.first_name) return ctx.from.first_name;
  else if (ctx.from.last_name) return ctx.from.last_name;
  else return { error: "no name found" };
};

// add run ==================================================================
bot.command("add", ctx => {
  let pace;
  let statsNew;
  let username = getUserName(ctx);
  console.log(`msg from user: ${username}: ${ctx.message.text}`);
  var parts = ctx.message.text.split(" ");
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
    if (distance > 50) {
      sendSpecMsg(ctx, "aga");
    } else if (distance != 0 && duration != 0) {
      notes.add(username, distance, duration);
      statsNew = notes.getLastXStats(STATSDAYS, username);
      pace = notes.getPace(distance, duration);
      sendSpecMsg(ctx, "run added");
    } else sendSpecMsg(ctx, "Usage: /add <a>km <b>min");
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
  if (!input) return { error: "no input" };
  let result = input;
  result = result.replace("*", "*");
  result = result.replace("_", "_");
  result = result.replace("`", "`");
  return result;
};

const addMarkdownEvenWidth = input => "```\n".concat(input).concat("\n```");
const roundFloat = (x, aD) => Number(x.toFixed(aD));

bot.launch();
