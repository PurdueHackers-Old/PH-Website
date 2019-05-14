import 'reflect-metadata';
import * as express from 'express';
import 'express-async-errors';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as mongoose from 'mongoose';
import * as passport from 'passport';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as yes from 'yes-https';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { Queue } from 'bull';
import { Logger } from 'winston';
import CONFIG from './config';
import passportMiddleWare, { extractUser } from './middleware/passport';
import { globalError } from './middleware/globalError';
import { SuccessInterceptor } from './interceptors/success.interceptor';
import { currentUserChecker, authorizationChecker } from './middleware/authentication';
import { createLogger } from './utils/logger';
import { createQueue } from './utils/queue';

const { NODE_ENV, DB } = CONFIG;

export default class Server {
	public static async createInstance() {
		const server = new Server();
		await server.setupMongo();
		return server;
	}
	public app: express.Application;
	public mongoose: typeof mongoose;
	public logger: Logger;
	public queues: {
		[x: string]: Queue<any>;
	};

	private constructor() {
		this.app = express();
		this.logger = createLogger(this);
		this.queues = {};
		this.setup();
	}

	public async startJobs() {
		// Sync with events on facebook page every 3 hours
		return Promise.all([
			this.queues.facebook.add(
				{},
				{
					repeat: {
						cron: '0 */3 * * *'
					},
					removeOnComplete: true,
					removeOnFail: true
				}
			)
		]);
	}

	private setup(): void {
		this.setupMiddleware();
		// Enable controllers in this.app
		useContainer(Container);
		this.app = useExpressServer(this.app, {
			cors: true,
			defaultErrorHandler: false,
			validation: true,
			controllers: [__dirname + '/controllers/*'],
			// controllers: [AuthController, MemberController, EventsController],
			interceptors: [SuccessInterceptor],
			currentUserChecker,
			authorizationChecker
		});
		// Any unhandled errors will be caught in this middleware
		this.app.use(globalError);
		this.setupRoutes();
		if (NODE_ENV === 'production') this.setupQueues();
	}

	private setupMiddleware() {
		this.app.use(helmet());
		if (NODE_ENV === 'production') this.app.use(yes());
		if (NODE_ENV !== 'test')
			NODE_ENV !== 'production' ? this.app.use(logger('dev')) : this.app.use(logger('tiny'));
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(passportMiddleWare(passport).initialize());
		this.app.use(cors());
		this.app.use(extractUser());
	}

	private setupRoutes() {
		// this.app.use('/api', home);
		// this.app.use('/api/auth', auth);
		// this.app.use('/api/members', members);
		// this.app.use('/api/events', events);
		// this.app.use('/api/jobs', jobs);
		// this.app.use('/api/locations', locations);
		// this.app.use('/api/credentials', credentials);
		// this.app.use('/api/permissions', permissions);
		// this.app.use('/api/autocomplete', autocomplete);
		// this.app.use('/api/report', reports);
		// Any unhandled errors will be caught in this middleware
		// this.app.use(globalError);
	}

	private setupQueues() {
		this.queues.facebook = createQueue('facebook');
	}

	private async setupMongo() {
		try {
			this.mongoose = await mongoose.connect(
				DB,
				{ useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }
			);
			this.mongoose.Promise = Promise;
			return this.mongoose;
		} catch (error) {
			this.logger.error('Error connecting to mongo:', error);
			throw error;
		}
	}
}
