const { ClientOpts: ClientOptions } = require('./structures/options.js');
const PartialUser = require('./structures/PartialUser.js');
const WebSocket = require('ws');
const EventEmitter = require('events');

const Events = {
	READY: 'ready',
	CLOSE: 'close',
	DEBUG: 'debug',
};

/**
 * @external WebSocket
 * @see https://npmjs.org/package/ws
 */

/**
 * The Client that connects to the botlist.space gateway.
 */
class Client extends EventEmitter {
	/**
	 * @param {ClientOptions} [options] Options to pass.
	 */
	constructor(options = {}) {
		super();

		/**
		 * ClientOptions.
		 * @type {ClientOptions}
		 */
		this.options = Object.assign(ClientOptions, options);

		/**
		 * The time of when the WebSocket connection is established.
		 * @type {?boolean}
		 */
		this.ready = null;

		/**
		 * An array of WebSocket ping speed. To get the average ping, check {@link Client#ping}
		 * @type {number[]}
		 */
		this.pings = [];

		this.edit(options, true);

		/**
		 * The [simple.space](https://npmjs.org/package/simple.space)'s Client instance.
		 * Used for fetching Bots if [this.options.fetch]({@link ClientOptions}) is present.
		 */
		this.space = null;

		try {
			const Space = require('simple.space');
			this.space = new Space.Client({ cache: false });
		} catch (e) {
			this._debug('Unable to find simple.space module; Make sure ClientOptions#fetch is set to false...');
		}

		this._debug('Now Connecting...');

		/**
		 * The WebSocket Connection.
		 * @type {WebSocket}
		 */
		this.ws = new WebSocket('wss://gateway.botlist.space')
			.on('open', () => {
				this.ready = new Date();
				this.emit(Events.READY, this.ready);
				this._debug('Successfully connected to botlist.space Gateway');

				const body = {
					op: 0,
					t: this.ready,
					d: {
						tokens: this.options.tokens,
					},
				};

				this.ws.send(JSON.stringify(body));
				this.ws.ping(Date.now());

				this.int = setInterval(() => {
					if (this.ws.readyState !== this.ws.OPEN) return clearInterval(this.int);
					this.ws.send(JSON.stringify(body));
					this.ws.ping(Date.now());
					this._debug('WebSocket Ping and Heartbeat Check Performed');
				}, 45e3);
			})
			.on('message', async (data) => {
				data = JSON.parse(data);
				this._debug('Received Update From Client');
				this.emit('raw', data);

				if (data.op === 2) {
					/**
					 * @typedef {object} ViewContents
					 * @property {Bot} bot The Bot that was viewed upon by a user.
					 * @property {string} botID The bot's ID.
					 * @property {number} timestamp The timestamp of when the view took place.
					 */
					const view = {
						timestamp: data.t,
						bot: await this.space.fetchBot(data.d.bot, { raw: this.options.raw }),
						botID: data.d.bot,
					};

					this.emit('view', view);
				} else if (data.op === 3) {
					/**
					 * @typedef {object} InviteContents
					 * @property {Bot} bot The bot that was requested of an invite of.
					 * @property {string} botID The bot's ID.
					 * @property {number} timestamp The timestamp of when the bot's invite was requested.
					 */
					const click = {
						timestamp: data.t,
						bot: await this.space.fetchBot(data.d.bot, { raw: this.options.raw }),
						botID: data.d.bot,
					};

					this.emit('invite', click);
				} else if (data.op === 4) {
					/**
					 * @typedef {object} UpvoteContents
					 * @property {Bot} bot The bot that was requested of an invite of.
					 * @property {string} botID The bot's Discord ID.
					 * @property {PartialUser} user The user that upvoted the bot.
					 * @property {string} userID The user's Discord ID.
					 * @property {number} timestamp The timestamp of when the upvote took place.
					 */
					const upvote = {
						timestamp: data.t,
						bot: await this.space.fetchBot(data.d.bot, { raw: this.options.raw }),
						botID: data.d.bot,
						user: new PartialUser(data.d.user),
						userID: data.d.user.id,
					};

					this.emit('upvote', upvote);
				}
			})
			.on('error', console.error)
			.on('disconnect', (code, message) => {
				this.emit(Events.CLOSE, { code: code, message: message });
				clearInterval(this.int);
			})
			.on('pong', data => {
				const old = parseInt(data.toString());
				const now = Date.now();
				this.pings.push(now - old);
				while (this.pings.length > 3) this.pings.pop();
			});
	}

	/**
	 * The average ping of some of the recent pings performed.
	 * @type {?number}
	 */
	get ping() {
		if (!this.pings.length) return null;
		return (this.pings.reduce((a, b) => a + b, 0)) / (this.pings.length);
	}

	/**
	 * The timestamp of when the WebSocket was ready.
	 * @type {number}
	 */
	get readyTimestamp() {
		return this.ready ? this.ready.getTime() : null;
	}

	/**
	 * Emits the DEBUG event.
	 * @private
	 * @returns {void}
	 */
	_debug(...messages) {
		this.emit(Events.DEBUG, ...messages);
	}

	/**
	 * Edits the ClientOptions.
	 * @param {ClientOptions} [options] Options to change.
	 * @param {boolean} [preset] If set to true, uses the original options instead of {@link Client#options}
	 * @returns {ClientOptions}
	 */
	edit(options, preset = false) {
		const opts = Object.assign(preset ? ClientOptions : this.options, options);
		if (typeof opts.raw !== 'boolean') throw new TypeError('options.raw must be boolean.');
		if (typeof opts.fetch !== 'boolean') throw new TypeError('options.fetch must be boolean.');
		if (!Array.isArray(opts.tokens)) throw new TypeError('options.tokens must be an array.');
		if (!opts.tokens.length) throw new SyntaxError('options.tokens must include at least 1 bot token provided from botlist.space.');
		if (opts.tokens.some(i => typeof i !== 'string')) throw new TypeError('options.tokens requires all values to be a string.');
		this.options = opts;
	}

	/**
	 * Closes the WebSocket Gateway.
	 * @returns {void}
	 */
	close() {
		return this.ws.close();
	}
}

module.exports = Client;