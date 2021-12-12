require("dotenv").config()

const { Client, Intents } = require('discord.js');

const client = new Client({ intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES | Intents.FLAGS.GUILD_MESSAGE_REACTIONS});

client.once('ready', () => {
	console.log('Ready!');
	});

class Grid {
	constructor (channel) {
		this.grid = [
			['😀','😃','😄'],
			['😀','😃','😄'],
			['😀','😃','😄']
		]
		this.p1 = '😈';
		this.p3 = '🐻';
		this.channel = channel;
		this.messages = [];
		this.createGrid().then(r=>this.setCell(0,0,this.p1)).then(console.log);
	}

	async createGrid() {
		for (let y=0; y<3; y++) {
			this.messages.push(await this.channel.send("."))
			for (const emoji of this.grid[y]) {
				const r = await this.messages[y].react(emoji);
			}
		}
		return this.messages;
	}

	async getCell (x, y) {
		return [...this.messages[y].reactions.cache.keys()][x];
	}

	async setCell (x, y, newEmoji) {
		this.grid[y][x] = newEmoji;
		this.messages[y].reactions.removeAll();
		for (const emoji of this.grid[y]) {
			const r = await this.messages[y].react(emoji);
		}
	}
}

class TicTacToe {
	constructor(player1, player2, channel) {
		this.players = [player1, player2];
		this.player = player1;
		this.channel = channel;
	}

	// TODO

}

client.on('messageCreate', async (msg) => {
	if (msg.content.startsWith("ttt") && (msg.mentions.users.size == 2 || 1)) {
		console.log("Let's play")
	//	const play = new TicTacToe(...msg.mentions.users, msg.channel);
		new Grid(msg.channel)
	}
})

client.login(process.env.TOKEN);
