import Server from '../server';
import { syncFacebookEvents } from './facebook';

export const start = async () => {
	try {
		console.log('Starting Facebook processor');
		const server = await Server.createInstance();
		// await server.queues.facebook.empty();
		server.queues.facebook.process(syncFacebookEvents);
	} catch (error) {
		console.error('Worker Error:', error);
	}
};

// start().catch(err => console.error('Uncaught worker error:', err));
