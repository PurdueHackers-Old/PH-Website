import * as util from 'util';
import chalk from 'chalk';
import { createLogger as createWinstonLogger, format, transports } from 'winston';
import CONFIG from '../config';
import winston = require('winston');

const customConsoleFormat = format.printf(({ level, timestamp, context, message, meta }) => {
	let result = `[${level}] [${timestamp}]`;
	if (context) result += ` ${chalk.yellow(`[${context}]`)} --`;
	result += ` ${message}`;

	// if (meta) result += ` ${(util as any).inspect(...meta, { colors: true, compact: false })}`;
	if (meta && Array.isArray(meta))
		result += `${(util as any).formatWithOptions({ colors: true, compact: false }, ...meta)}`;
	else if (meta)
		result += ` ${(util as any).formatWithOptions({ colors: true, compact: false }, meta)}`;

	return result;
});

const enumerateErrorFormat = format((info: any) => {
	if (info.message instanceof Error) {
		info.message = Object.assign(
			{
				message: info.message.message,
				stack: info.message.stack
			},
			info.message
		);
	}

	if (info instanceof Error) {
		return Object.assign(
			{
				message: info.message,
				stack: info.stack
			},
			info
		);
	}

	return info;
});

const transporters = context => [
	new transports.Console({
		format: format.combine(
			format(info => {
				info.level = info.level.toUpperCase();
				info.context = context;
				info.timestamp = new Date(Date.now()).toLocaleString();
				return info;
			})(),
			enumerateErrorFormat(),
			format.splat(),
			format.colorize(),
			format.prettyPrint(),
			customConsoleFormat
		)
	})
];

// tslint:disable-next-line:ban-types
export const createLogger = (context: string | object | (() => any)) => {
	if (typeof context === 'object') context = context.constructor.name;
	if (typeof context === 'function') context = context.name;
	return createWinstonLogger({
		transports: transporters(context),
		silent: CONFIG.NODE_ENV === 'test',
		levels: winston.config.syslog.levels
	}).on('error', err => {
		console.log('Logger Error:', err);
	});
};
