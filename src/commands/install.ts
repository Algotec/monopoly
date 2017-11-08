import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";


export interface installOptions {
}


export class InstallCommand extends BaseCommand {
	getHandler() {
		return async (args: object, options: installOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
				this.spinner.info(`Setting up packages ${lerna.packageFolders.join(',')}`).start();
				const cmd = `lerna bootstrap`;
				await this.exec(cmd);
				this.spinner.succeed('install completed')
			} catch (e) {
				this.debug(e);
				this.spinner.fail(JSON.stringify(e));
				this.error(e.message);
			}
		}
	}
}

export default new InstallCommand();