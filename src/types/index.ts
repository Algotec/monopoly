import {cliLogger} from "../lib/logger";
import chalk from 'chalk';

export * from "./repo.api-interface";
export * from "./tasks.api-interface";
export * from "./package.types";
import caporal = require("caporal");

export interface Logger {
	debug(str: string): void;

	info(str: string): void;

	log(str: string): void;

	warn(str: string): void;

	error(str: string): void;
}

export type STATUS = 'OK' | "ERROR";

export interface SingleValueResult<T> extends AsyncResult {
	data?: T;
}

export class GenericAsyncError implements AsyncResult {
	status = 'ERROR' as STATUS;

	constructor(public message: string) {}

}

export class DieHardError extends Error {
	constructor(message: string) {
		super(message);
		cliLogger.error(chalk.red(message));
		process.exit(1);
		return;
	}
}

export interface AsyncResult {
	status: STATUS;
	message?: string;
}


export interface CliTool {
	parse(args: typeof process.argv): void;

	command: typeof caporal.command;
}

export type ActionCallback = (args: any,
	options: any,
	logger: Logger) => void | Promise<void>;

export interface ICliOptions {
	version: string;
	logger: Logger;
	name: string;
	description: string;
}
