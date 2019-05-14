import 'jest';
import Server from '../../src/server';
import * as supertest from 'supertest';
import { generateEvent, generateEvents, generateUser } from '../helper';
import { Event } from '../../src/models/event';
import { Member, IMemberModel } from '../../src/models/member';
import { Permission } from '../../src/models/permission';
import { ObjectId } from 'mongodb';
import * as nock from 'nock';

const createUserWithEventCreationPermission = async () => {
	const admin = await request
		.post('/api/auth/signup')
		.send(generateUser())
		.then(response => response.body.response);

	const permission = new Permission({
		name: 'events',
		description: 'manage events'
	});

	await permission.save();

	admin.user.permissions = [permission._id];

	const databaseUser = await Member.findById(admin.user._id).exec();
	databaseUser.permissions = admin.user.permissions;
	await databaseUser.save();

	return admin;
};

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
let user: { user: IMemberModel; token: string };

describe('Suite: /api/events', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	beforeEach(async () => {
		user = await createUserWithEventCreationPermission();
	});

	describe('Create an event', () => {
		it('Fails to create an event because no name', async () => {
			const event = generateEvent();
			delete event.name;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a name');
		});

		it('Fails to create an event because no time', async () => {
			const event = generateEvent();
			delete event.eventTime;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a time');
		});

		it('Fails to create an event because invalid time', async () => {
			const event = generateEvent();
			(event as any).eventTime = 'Invalid Date';

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a time');
		});

		it('Fails to create an event because no location', async () => {
			const event = generateEvent();
			delete event.location;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a location');
		});

		it('Fails to create an event because of an invalid facebook link', async () => {
			const event = generateEvent();
			event.facebook = 'www.google.com';

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Must specify a url from Facebook');
		});

		it('Successfully creates an event', async () => {
			const event = generateEvent();
			event.privateEvent = false;

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toMatchObject({
				members: [],
				name: event.name,
				privateEvent: false,
				eventTime: event.eventTime.toISOString(),
				location: event.location,
				facebook: event.facebook
			});
		});

		it('Successfully creates a private event', async () => {
			const event = { ...generateEvent(), privateEvent: true };

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toMatchObject({
				members: [],
				name: event.name,
				privateEvent: true,
				eventTime: event.eventTime.toISOString(),
				location: event.location,
				facebook: event.facebook
			});
		});
	});

	describe('Get all events', () => {
		it('Returns all non-private events', async () => {
			const events = generateEvents(2);

			await Promise.all([
				new Event({
					name: events[0].name,
					privateEvent: false,
					eventTime: Date.parse(events[0].eventTime.toISOString()),
					location: events[0].location
				}).save(),
				new Event({
					name: events[1].name,
					privateEvent: true,
					eventTime: Date.parse(events[1].eventTime.toISOString()),
					location: events[1].location
				}).save()
			]);

			const {
				body: {
					response: { events: responseEvents }
				},
				status
			} = await request.get('/api/events');

			expect(status).toEqual(200);
			expect(responseEvents.length).toEqual(1);
			expect(responseEvents).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: events[0].name,
						eventTime: events[0].eventTime.toISOString(),
						location: events[0].location
					})
				])
			);
		});

		it('Returns all events (including private)', async () => {
			const events = generateEvents(2);

			await Promise.all([
				new Event({
					name: events[0].name,
					privateEvent: false,
					eventTime: Date.parse(events[0].eventTime.toISOString()),
					location: events[0].location
				}).save(),
				new Event({
					name: events[1].name,
					privateEvent: true,
					eventTime: Date.parse(events[1].eventTime.toISOString()),
					location: events[1].location
				}).save()
			]);

			const {
				body: {
					response: { events: responseEvents }
				},
				status
			} = await request.get('/api/events').auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(responseEvents.length).toEqual(2);
			for (const event of events) {
				expect(responseEvents).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							name: event.name,
							eventTime: event.eventTime.toISOString(),
							location: event.location
						})
					])
				);
			}
		});
	});

	describe('Get a single event', () => {
		it('Fails to get a single event because invalid id', async () => {
			const {
				body: { error },
				status
			} = await request.get('/api/events/invalidID');

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid event ID');
		});

		it('Fails to get a single event because event does not exist', async () => {
			const {
				body: { response },
				status
			} = await request.get(`/api/events/${new ObjectId()}`);

			expect(status).toEqual(200);
			expect(response).toEqual('');
		});

		it('Successfully gets a single event', async () => {
			const event = await new Event(generateEvent()).save();

			const {
				body: { response },
				status
			} = await request.get(`/api/events/${event._id}`);

			expect(status).toEqual(200);
			expect(response).toEqual(
				expect.objectContaining({
					name: event.name,
					eventTime: event.eventTime.toISOString(),
					location: event.location
				})
			);
		});
	});

	describe('Update an event', () => {
		it('Fails to update an event because invalid id', async () => {
			const event = await new Event(generateEvent()).save();
			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/invalidId`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid event ID');
		});

		it("Fails to update an event because the event doesn't exist", async () => {
			const event = generateEvent();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${new ObjectId()}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event does not exist');
		});

		it('Fails to update an event because no name', async () => {
			const event = generateEvent();
			const createdEvent = await new Event(event).save();

			delete event.name;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${createdEvent._id}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a name');
		});

		it('Fails to update an event because no time', async () => {
			const event = generateEvent();
			const createdEvent = await new Event(event).save();

			delete event.eventTime;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${createdEvent._id}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a time');
		});

		it('Fails to update an event because no location', async () => {
			const event = generateEvent();
			const createdEvent = await new Event(event).save();

			delete event.location;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${createdEvent._id}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event must have a location');
		});

		it('Fails to update an event because of an invalid facebook link', async () => {
			const event = generateEvent();
			const createdEvent = await new Event(event).save();

			event.facebook = 'www.google.com';

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${createdEvent._id}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Must specify a url from Facebook');
		});

		it('Successfully updates an event', async () => {
			const event = generateEvent();
			event.privateEvent = true;
			const createdEvent = await new Event(event).save();

			event.name = 'Updated name';
			event.privateEvent = false;

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events/${createdEvent._id}`)
				.send(event)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toEqual(
				expect.objectContaining({
					name: event.name,
					eventTime: event.eventTime.toISOString(),
					location: event.location,
					privateEvent: false
				})
			);
		});
	});

	describe('Delete an event', () => {
		it('Fails to delete an event because invalid id', async () => {
			const {
				body: { error },
				status
			} = await request.delete(`/api/events/invalidId`).auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid event ID');
		});

		it("Fails to delete an event because the event doesn't exist", async () => {
			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event does not exist');
		});

		it('Succesfully deletes an event', async () => {
			const event = await new Event(generateEvent()).save();
			const {
				body: { response },
				status
			} = await request
				.delete(`/api/events/${event._id}`)
				.auth(user.token, { type: 'bearer' });

			const eventAfterDeletion = await Event.findById(event._id).exec();

			expect(eventAfterDeletion).toBeNull();
			expect(response).toEqual(
				expect.objectContaining({
					name: event.name,
					eventTime: event.eventTime.toISOString(),
					location: event.location
				})
			);
		});
	});

	describe('Checkin user to event', () => {
		it('Fails to check in user to event because invalid event id', async () => {
			const {
				body: { error },
				status
			} = await request
				.post('/api/events/invalidId/checkin')
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid event ID');
		});

		it("Fails to check in user to event because the event doesn't exist", async () => {
			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${new ObjectId()}/checkin`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event does not exist');
		});

		it('Fails to check in user to event because the user has no name', async () => {
			const event = await new Event(generateEvent()).save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					email: 'fake'
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid name');
		});

		it('Fails to check in user to event because the user has no email', async () => {
			const event = await new Event(generateEvent()).save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: 'fake'
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid email');
		});

		it('Fails to check in user to event because the user has an invalid email', async () => {
			const event = await new Event(generateEvent()).save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: 'fake',
					email: 'fake'
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid email');
		});

		it("Fails to check in user to event because the users email is associated with anothers user's account", async () => {
			const event = await new Event(generateEvent()).save();
			const member = new Member(generateUser());
			await member.save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: 'Different user name',
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('A member with a different name is associated with this email');
		});

		it('Fails to check in user to event because the user is already checked in', async () => {
			const event = await new Event(generateEvent()).save();
			const member = new Member(generateUser());
			await member.save();

			await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: member.name,
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			const {
				body: { error },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: member.name,
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Member already checked in');
		});

		it('Successfully checks in user to event given a user id of a created member', async () => {
			const event = await new Event(generateEvent()).save();
			const member = new Member(generateUser());
			await member.save();

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					memberID: member._id,
					name: member.name,
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			const updatedMemberWithEvent = await Member.findById(member._id).exec();
			const updatedEventWithMember = await Event.findById(event._id).exec();

			expect(updatedMemberWithEvent.events).toEqual(expect.arrayContaining([event._id]));
			expect(updatedEventWithMember.members).toEqual(expect.arrayContaining([member._id]));
			expect(status).toEqual(200);
		});

		it('Successfully checks in user to event given a name and email of an already created member', async () => {
			const event = await new Event(generateEvent()).save();
			const member = new Member(generateUser());
			await member.save();

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: member.name,
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			const updatedMemberWithEvent = await Member.findById(member._id).exec();
			const updatedEventWithMember = await Event.findById(event._id).exec();

			expect(updatedMemberWithEvent.events).toEqual(expect.arrayContaining([event._id]));
			expect(updatedEventWithMember.members).toEqual(expect.arrayContaining([member._id]));
			expect(status).toEqual(200);
		});

		it('Successfully checks in user to event given a name and email of a person who doesnt have an account', async () => {
			const event = await new Event(generateEvent()).save();
			const member = generateUser();

			nock('https://api.sendgrid.com')
				.post('/v3/mail/send')
				.reply(200);

			const {
				body: { response },
				status
			} = await request
				.post(`/api/events/${event._id}/checkin`)
				.send({
					name: member.name,
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			const createdMemberId = response.members[0]._id;

			const updatedMemberWithEvent = await Member.findById(createdMemberId).exec();
			const updatedEventWithMember = await Event.findById(event._id).exec();

			expect(updatedMemberWithEvent.events).toEqual(
				expect.arrayContaining([new ObjectId(event._id)])
			);
			expect(updatedEventWithMember.members).toEqual(
				expect.arrayContaining([new ObjectId(createdMemberId)])
			);
			expect(status).toEqual(200);
			nock.restore();
		});
	});

	describe('Checkout user from event', () => {
		it('Fails to check out user from event because invalid event id', async () => {
			const member = new Member(generateUser());
			await member.save();

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/invalidId/checkin/${member._id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid event ID');
		});

		it('Fails to check out user from event because event does not exist', async () => {
			const member = new Member(generateUser());
			await member.save();

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/${new ObjectId()}/checkin/${member._id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Event does not exist');
		});

		it('Fails to check out user from event because invalid member id', async () => {
			const event = new Event(generateEvent());
			await event.save();

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/${event._id}/checkin/invalidId`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid member ID');
		});

		it('Fails to check out user from event because member does not exist', async () => {
			const event = new Event(generateEvent());
			await event.save();

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/${event._id}/checkin/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Member does not exist');
		});

		it('Fails to check out user from event because they were never checked in', async () => {
			const event = new Event(generateEvent());
			const member = new Member(generateUser());
			await event.save();
			await member.save();

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/events/${event._id}/checkin/${member._id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Member is not checked in to this event');
		});

		it('Succesfully checks out user from event', async () => {
			const event = new Event(generateEvent());
			const member = new Member(generateUser());

			member.events.push(event);
			event.members.push(member);

			await member.save();
			await event.save();

			const {
				body: { response },
				status
			} = await request
				.delete(`/api/events/${event._id}/checkin/${member._id}`)
				.auth(user.token, { type: 'bearer' });

			const updatedMember = await Member.findById(member._id).exec();

			expect(status).toEqual(200);
			expect(response.members.length).toEqual(0);
			expect(updatedMember.events.length).toEqual(0);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
