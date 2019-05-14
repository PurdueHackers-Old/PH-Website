import { createLogger } from '../utils/logger';
import winston = require('winston');

export class BaseController {
	readonly logger: winston.Logger;
	constructor() {
		this.logger = createLogger(this);
	}
}
