const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const token = require("../favoriteToken.js");

const bot = new TelegramBot (token, { polling: { interval: 1000 } });

let editList = false;

let favoriteList = JSON.parse(fs.readFileSync("../favoriteList.json", "UTF-8"),null, 2);

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
`
Привет! Я бот для сохранения ссылок на избранные сообщения в чатах, чтобы я заработал в твоём чате, нужно добавить меня в нужный чат и сделать администратором.

Разработал @liveisabrurd
`)
})

bot.onText(/\/favorite/, (msg) => {
    const userId = msg.from.id;
    const favoriteName = msg.text.replace('/favorite', '') ? msg.text.replace('/favorite', '') : ' Сообщение'
    const chatInfo = msg.reply_to_message.chat.username ? msg.reply_to_message.chat.username : msg.reply_to_message.chat.id;
    const url = msg.chat.username ?
    `https://t.me/${msg.reply_to_message.chat.username}/${msg.reply_to_message.message_id}` :
    `https://t.me/c/${msg.reply_to_message.chat.id.toString().substring(3)}/${msg.reply_to_message.message_id}`

    if (!favoriteList[userId]) {
        favoriteList[userId] = {
            [chatInfo]: [{name:favoriteName, url:url}]
        }
    } else if (!favoriteList[userId][chatInfo]) {
        favoriteList[userId][chatInfo] = [{name:favoriteName, url:url}]
    } else {
        favoriteList[userId][chatInfo].push({name:favoriteName, url:url});
    }

    editList = true;

    bot.sendMessage(msg.chat.id,'Сообщение добавлено в закладки!', {reply_to_message_id: msg.message_id})

})

bot.onText(/\/list/, (msg) => {
    const userId = msg.from.id;
    const chatInfo = msg.chat.username ? msg.chat.username : msg.chat.id;
    if (!favoriteList[userId]) {
        bot.sendMessage(msg.chat.id, 'У тебя ещё нет закладок! Чтобы добавить отправь /favorite на любое сообщение!', {reply_to_message_id: msg.message_id});
        return;
    } else {
        const text = favoriteList[userId][chatInfo].map((el, i) => {
            return `${i + 1}.[${el.name}](${el.url})`
        }).join('\n')
        bot.sendMessage(msg.chat.id, 
`
Твои закладки из этого чата:

${text}`, {parse_mode: 'Markdown', disable_web_page_preview: true, reply_to_message_id: msg.message_id});
    }
})

setTimeout(() => {
    if (!editList) {return};
    fs.writeFile("../favoriteList.json", JSON.stringify(favoriteList, null, 2), "UTF-8", (err) => {
        if (err) {
          console.log(err);
        }
        editList = false;
    });
}, 20000);

process.on("SIGINT", () => {
    fs.writeFile("../favoriteList.json", JSON.stringify(favoriteList, null, 2), "UTF-8", (err) => {
        if (err) {
          console.log(err);
        }
        editList = false;
        process.exit(0);
    });
})