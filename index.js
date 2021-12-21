const { Client, Intents } = require("discord.js");
const config = require("./config.json");
const TitTacToe = require("./lib/tictactoe.js");

const client = new Client({
  intents:
    Intents.FLAGS.GUILDS |
    Intents.FLAGS.GUILD_MESSAGES |
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
});

client.once("ready", () => {
  console.log("Bot ready !");
});

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("ttt") && msg.mentions.users.size == 2) {
    const players = [...msg.mentions.users];
    const game = new TicTacToe(client, msg.channel, players[0], players[1]);
  }
});

client.login(config.token);
