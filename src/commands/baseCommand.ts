import * as sh from 'shelljs';
import {DieHardError, Logger, RepoApiInterface, TasksManagementAPIInterface} from "../types";
import * as winston from 'winston'; //keep this here for types
import {cliLogger} from "../lib/logger";
import {ExecOptions, ExecOutputReturnValue} from "shelljs";
import * as Ora from 'ora';
import {FileDocument} from "../lib/fileDocument";
import * as path from "path";

export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

export interface ISpinner {
	start(text?: string): ISpinner;

	stop(): ISpinner;

	succeed(text?: string): ISpinner;

	fail(text?: string): ISpinner;

	warn(text?: string): ISpinner;

	info(text?: string): ISpinner;

	clear(): ISpinner;

	text: string;

	color: Color;

}

export enum ShellCommands {
	RM = 'rm'
}

export interface execResult {
	code: number,
	stdout: string,
	stderr: string
};
export type asyncCommandFn = (...args: any[]) => Promise<any>;
export type cmdArray = [ShellCommands, string] | [ShellCommands, string, string];
export type cmdsArray = Array<string | cmdArray | asyncCommandFn>;

export abstract class BaseCommand {
	repoApi:RepoApiInterface;
	taskApi:TasksManagementAPIInterface;
	log = cliLogger.log;
	debug = cliLogger.debug;
	warn = cliLogger.warn;
	error = cliLogger.error;
	info = cliLogger.info;
	protected spinner: ISpinner = Ora({spinner: 'dots'});

	async execAll(cmds: cmdsArray) {
		const final: execResult[] = [];
		await cmds.reduce((promise, cmd) => {
			return promise
				.then(async (result) => {
					if (typeof cmd === 'function') {
						return await cmd();
					}
					else return await this.exec(cmd)
						.then((result: any) => {
							(result) ? final.push(result) : null;
						})
				})
				.catch((e) => {
					throw new Error(e);
				});
		}, Promise.resolve());
		return final;
	}

	async exec(cmd: string | string[], options?: { cwd: string }): Promise<execResult> {
		let retVal: execResult = {code: 0, stdout: '', stderr: ''};
		if (Array.isArray(cmd)) {
			const [type, ...args] = cmd;
			switch (type) {
				case ShellCommands.RM:
					try {
						sh.rm(...args);
					} catch (e) {
						retVal.code = 1;
						retVal.stderr = e.message;
						throw new Error(JSON.stringify(retVal));
					}
			}
			return retVal;
		} else {
			this.debug(cmd);
			try {
				retVal = await new Promise<execResult>((resolve, reject) => {
					const shOptions: ExecOptions = {silent: true};
					if (options && options.cwd) {
						shOptions.cwd = options.cwd;
					}
					sh.exec(cmd, shOptions, (code: number, stdout: string, stderr: string) => {
						if (stderr) {
							this.debug(stderr);
						}
						if (code) {
							return reject({code, stdout, stderr});
						}
						return resolve({code, stdout, stderr});
					});
				});
			} catch (e) {
				retVal.code = e.code || 1;
				retVal.stderr = e.message;
				throw new Error(JSON.stringify(retVal));
			}
			return retVal;
		}
	}

	getDocument(filename: string): Promise<FileDocument> {
		return new FileDocument(path.resolve(filename)).read();
	}

	outputFile(filename: string, content: string) {
		((sh as any).ShellString(content)as any).to(filename);
	}

	abstract getHandler(repoApi?: RepoApiInterface, tasksApi?: TasksManagementAPIInterface): (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => void;
}

