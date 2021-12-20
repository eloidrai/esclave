require("dotenv").config();

const { Client, Intents } = require("discord.js");

const client = new Client({
  intents:
    Intents.FLAGS.GUILDS |
    Intents.FLAGS.GUILD_MESSAGES |
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
});

client.once("ready", () => {
  console.log("Ready!");
});

function range(n) {
  return new Array(n).fill().map((_, i) => i);
}

class Grid {
  constructor(channel, players) {
    this.grid = [
      ["😀", "😃", "😄"],
      ["😀", "😃", "😄"],
      ["😀", "😃", "😄"],
    ];
    this.players = players;
    this.channel = channel;
    this.messages = [];
  }

  async createGrid() {
    for (let y = 0; y < 3; y++) {
      this.messages.push(await this.channel.send("."));
      for (const emoji of this.grid[y]) {
        await this.messages[y].react(emoji);
      }
    }
  }

  async setCell(x, y, newEmoji) {
    this.grid[y][x] = newEmoji;
    this.messages[y].reactions.removeAll();
    for (const emoji of this.grid[y]) {
      await this.messages[y].react(emoji);
    }
  }

  getCell(x, y) {
    return [...this.messages[y].reactions.cache.keys()][x];
  }

  getColumn(x) {
    return range(3).map((y) => this.grid[y][x]);
  }

  getDiagonals() {
    return [
      range(3).map((c) => this.grid[c][c]),
      range(3).map((c) => this.grid[c][2 - c]),
    ];
  }

  getCoords(reaction) {
    const y = this.messages.findIndex((m) => m.id == reaction.message.id);
    const x = this.grid[y].indexOf(reaction.emoji.name);
    return [x, y];
  }
}

class Player {
  constructor([id, user], emojis) {
    this.user = user;
    this.id = user.id;
    this.emojis = emojis;
    this.emojiIndex = 0;
  }

  getEmoji() {
    return this.emojis[this.emojiIndex++];
  }
}

class TicTacToe {
  constructor(client, channel, player1, player2) {
    this.players = [
      new Player(player1, ["🍉", "🍅", "🍑", "🍎", "🍊"]),
      new Player(player2, ["🐒", "🙈", "🙊", "🙉", "🐵"]),
    ];

    this.currentPlayer = false; // False = 0

    this.client = client;
    this.channel = channel;
    this.count = 0;

    this.grid = new Grid(this.channel, this.players);

    (async () => {
      this.lock = true;
      await this.grid.createGrid();
      this.playerDisplay = await this.channel.send(
        `Joueur actuel **${
          this.players[+this.currentPlayer].user.username
        } ** ${this.players[+this.currentPlayer].emojis[0]}`
      );
      this.h = (r, u) => this.handle(r, u);
      this.client.on("messageReactionAdd", this.h);
      this.lock = false;
    })();
  }

  async handle(reaction, user) {
    if (
      this.lock ||
      !this.grid.messages.map((m) => m.id).includes(reaction.message.id) ||
      !["😀", "😃", "😄"].includes(reaction.emoji.name) ||
      user.id != this.players[+this.currentPlayer].id
    )
      return;
    this.lock = true;
    const coords = this.grid.getCoords(reaction);
    await this.grid.setCell(
      ...coords,
      this.players[+this.currentPlayer].getEmoji()
    );
    this.currentPlayer = !this.currentPlayer;
    await this.playerDisplay.edit(
      `Joueur actuel **${this.players[+this.currentPlayer].user.username}** ${
        this.players[+this.currentPlayer].emojis[0]
      }`
    );
    this.lock = false;
    const winner = this.checkForWinner();
    if (winner) {
      await reaction.message.reply(
        `Le joueur **${winner.user.username} ${winner.emojis[0]}** a gagné !`
      );
      await this.playerDisplay.delete();
      this.cleanup();
    }
  }

  checkForWinner() {
    for (const line of [
      ...this.grid.grid,
      ...range(3).map((y) => this.grid.getColumn(y)),
      ...this.grid.getDiagonals(),
    ]) {
      if (line.every((emoji) => this.players[0].emojis.includes(emoji)))
        return this.players[0];
      if (line.every((emoji) => this.players[1].emojis.includes(emoji)))
        return this.players[1];
    }
    return null;
  }

  cleanup() {
    this.client.removeListener("messageReactionAdd", this.h);
  }
}

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("ttt") && msg.mentions.users.size == 2) {
    const players = [...msg.mentions.users];
    const game = new TicTacToe(client, msg.channel, players[0], players[1]);
  }
});

client.login(process.env.TOKEN);
