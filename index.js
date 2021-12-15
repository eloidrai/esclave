// TODO : Gérer le fait qu'un même émoji ne peut être utilisé qu'une fois par ligne + localité + modularité + algo

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

class Grid {
  constructor(channel) {
    this.grid = [
      ["😀", "😃", "😄"],
      ["😀", "😃", "😄"],
      ["😀", "😃", "😄"],
    ];
    this.channel = channel;
    this.messages = [];
  }

  async createGrid() {
    for (let y = 0; y < 3; y++) {
      this.messages.push(await this.channel.send("."));
      for (const emoji of this.grid[y]) {
        const r = await this.messages[y].react(emoji);
      }
    }
  }

  async getCell(x, y) {
    return [...this.messages[y].reactions.cache.keys()][x];
  }

  async setCell(x, y, newEmoji) {
    this.grid[y][x] = newEmoji;
    this.messages[y].reactions.removeAll();
    for (const emoji of this.grid[y]) {
      await this.messages[y].react(emoji);
    }
  }

  async getCoords(reaction) {
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
  }
}

class TicTacToe {
  constructor(client, channel, player1, player2) {
    this.players = [
      new Player(player1, ["🍊", "🍉", "🍅", "🍑", "🍎"]),
      new Player(player2, ["🐒", "🙈", "🙊", "🙉", "🐵"]),
    ];
    console.log(this.players);

    this.currentPlayer = false; // False = 0

    this.client = client;
    this.channel = channel;

    this.grid = new Grid(this.channel);
    this.h = (r, u) => this.handle.call(this, r, u); // Règle le this de la méthode

    this.grid
      .createGrid()
      .then(async () => {
        this.playerDisplay = await this.channel.send(
          `Joueur actuel **${this.players[+this.currentPlayer].user.username}**`
        );
      })
      .then(() => {
        this.client.on("messageReactionAdd", this.h);
      });
  }

  handle(reaction, user) {
    if (user.id == this.players[+this.currentPlayer].id) {
      console.log(`Le joueur ${+this.currentPlayer} vient de réagir`);
      this.grid
        .getCoords(reaction)
        .then(([x, y]) =>
          this.grid.setCell(
            x,
            y,
            this.players[+this.currentPlayer].emojis.pop()
          )
        )
        .then(() => {
          this.currentPlayer = !this.currentPlayer;
          this.playerDisplay.edit(
            `Joueur actuel **${
              this.players[+this.currentPlayer].user.username
            }**`
          );
        });
    }
  }

  cleanup() {
    this.client.removeListener("messageReactionAdd", this.h);
  }
}

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("ttt") && msg.mentions.users.size == 2) {
    console.log("Let's play");
    const players = [...msg.mentions.users];
    const play = new TicTacToe(client, msg.channel, players[0], players[1]);
  }
});

client.login(process.env.TOKEN);
