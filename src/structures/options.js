/**
 * @typedef {object} ClientOptions
 * @property {boolean} [fetch=false] When set to true, will fetch a Bot before emitting an event. Requires `simple.space` be installed.
 * @property {boolean} [raw=false] When set to true, returns the raw object of the bot. Requires {@link ClientOptions#fetch} be true.
 * @property {string[]} [tokens=[]] An array of bot tokens provided from botlist.space to receive the bot's events from.
 */
exports.ClientOpts = {
	fetch: false,
	raw: false,
	tokens: [],
};