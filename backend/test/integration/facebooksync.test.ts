import 'jest';
import Server from '../../src/server';
import * as supertest from 'supertest';
import { spoofFacebookEvents } from '../helper';
import { testSyncFacebookEvents } from '../../src/workers/facebook';
import { Event } from '../../src/models/event';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

describe('Facebook Event Integration Tests', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	it('Successfully adds new upcoming events from facebook to the db', async () => {
		const facebookEvents = spoofFacebookEvents(3);
		await testSyncFacebookEvents(facebookEvents);
		const databaseEvents = await Event.find({}, '_id name location eventTime facebook').exec();

		for (const event of facebookEvents) {
			expect(databaseEvents).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: event.name,
						location: event.place.name,
						eventTime: event.start_time,
						facebook: `https://www.facebook.com/events/${event.id}`
					})
				])
			);
		}
	});

	it('Successfully updates upcoming events from facebook in the db', async () => {
		const originalFacebookEvent = spoofFacebookEvents(1);
		await testSyncFacebookEvents(originalFacebookEvent);
		const databaseEventsOriginal = await Event.find(
			{},
			'_id name location eventTime facebook'
		).exec();

		const facebookEvent = spoofFacebookEvents(1);
		await testSyncFacebookEvents(facebookEvent);
		const databaseEvents = await Event.find({}, '_id name location eventTime facebook').exec();

		expect(databaseEvents.length).toEqual(1);
		expect(databaseEvents).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: facebookEvent[0].name,
					location: facebookEvent[0].place.name,
					eventTime: facebookEvent[0].start_time,
					facebook: `https://www.facebook.com/events/${facebookEvent[0].id}`
				})
			])
		);
	});

	it('Deletes an upcoming event from the database, if its deleted from facebook', async () => {
		const originalFacebookEvent = spoofFacebookEvents(1);
		await testSyncFacebookEvents(originalFacebookEvent);
		const databaseEventsOriginal = await Event.find(
			{},
			'_id name location eventTime facebook'
		).exec();

		await testSyncFacebookEvents([]);
		const databaseEvents = await Event.find({}, '_id name location eventTime facebook').exec();

		expect(databaseEvents.length).toEqual(0);
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
