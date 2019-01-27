declare module 'simple.wspace' {
	import { EventEmitter } from 'events';
	import WebSocket from 'ws';
	import { Client as SpaceClient, Bot } from 'simple.space';

	export const version: string;
	export class Client extends EventEmitter {
		constructor(options?: ClientOptions);
		private space?: SpaceClient;
		public options: ClientOptions;
		public pings: number[];
		public ready?: Date;
		private ws: WebSocket;
		public readonly ping: number;
		public readonly readyTimestamp?: number;
		private _debug(...messages): void;
		public close(): void;
		public edit(options: ClientOptions, preset?: boolean): ClientOptions;

		public addListener(event: 'debug', listener: (...messages: string[]) => void): this;
		public addListener(event: 'invite', listener: (contents: InviteContents) => void): this;
		public addListener(event: 'raw', listener: (data: object) => void): this;
		public addListener(event: 'ready', listener: (readyAt: Date) => void): this;
		public addListener(event: 'upvote', listener: (contents: UpvoteContents) => void): this;
		public addListener(event: 'view', listener: (contents: ViewContents) => void): this;
		public on(event: 'debug', listener: (...messages: string[]) => void): this;
		public on(event: 'invite', listener: (contents: InviteContents) => void): this;
		public on(event: 'raw', listener: (data: object) => void): this;
		public on(event: 'ready', listener: (readyAt: Date) => void): this;
		public on(event: 'upvote', listener: (contents: UpvoteContents) => void): this;
		public on(event: 'view', listener: (contents: ViewContents) => void): this;
		public once(event: 'debug', listener: (...messages: string[]) => void): this;
		public once(event: 'invite', listener: (contents: InviteContents) => void): this;
		public once(event: 'raw', listener: (data: object) => void): this;
		public once(event: 'ready', listener: (readyAt: Date) => void): this;
		public once(event: 'upvote', listener: (contents: UpvoteContents) => void): this;
		public once(event: 'view', listener: (contents: ViewContents) => void): this;
	}

	type ClientOptions = {
		fetch?: boolean,
		raw?: boolean,
		tokens: string[],
	};

	type ViewContents = {
		timestamp: number,
		botID: string,
		bot?: Bot,
	};

	type InviteContents = {
		timestamp: number,
		botID: string,
		bot?: Bot,
	};

	type UpvoteContents = {
		timestamp: number,
		botID: string,
		bot?: Bot,
		user: PartialUser | object,
		userID: string,
	}
}

declare class PartialUser {
	constructor(obj: object);
	public avatar: string;
	public discriminator: string;
	public id: string;
	public username: string;
	public readonly page: string;
	public readonly tag: string;
	public toString(): string;
}