import 'jest';
import * as faker from 'faker';
import Server from '../../src/server';
import { generateUser, generateEvent } from '../helper';
import { Member } from '../../src/models/member';
import { Permission } from '../../src/models/permission';
import { IEventModel, Event } from '../../src/models/event';
import { EventsController } from '../../src/controllers/events.controller';

let server: Server;
let eventsController: EventsController;

let event: IEventModel;
let privateEvent: IEventModel;

const createUser = async () => {
	const generatedUser = generateUser();
	const user = await new Member(generatedUser).save();

	return user;
};

const createUserWithEventCreationPermission = async () => {
	const permission = new Permission({
		name: 'events',
		description: 'manage events'
	});
	await permission.save();

	const databaseUser = await new Member({
		...generateUser(),
		permissions: [permission._id]
	}).save();

	// population permissions
	const admin = await Member.findById(databaseUser._id).populate({
		path: 'permissions',
		model: Permission
	});

	return admin;
};

describe('Event controller unit tests', () => {
	beforeAll(async () => {
		await Server.createInstance().then(s => {
			server = s;
			eventsController = new EventsController();
		});
	});

	beforeEach(async () => {
		event = await new Event({ ...generateEvent(), privateEvent: false }).save();
		privateEvent = await new Event({ ...generateEvent(), privateEvent: true }).save();
	});

	describe('Get all Events', () => {
		it('Returns all non-private events', async () => {
			const user = await createUser();

			const response = await eventsController.getAll('eventTime', 1, user);
			expect(response.events).toHaveLength(1);

			const responseEvent = response.events[0];
			expect(responseEvent).toHaveProperty('_id');

			expect(responseEvent).toEqual(
				expect.objectContaining({
					name: event.name,
					eventTime: event.eventTime,
					location: event.location
				})
			);
		});

		it('Returns all public and private events', async () => {
			const user = await createUserWithEventCreationPermission();

			const response = await eventsController.getAll('eventTime', 1, user);
			expect(response.events).toHaveLength(2);

			expect(response.events).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: event.name,
						eventTime: event.eventTime,
						location: event.location
					}),
					expect.objectContaining({
						name: privateEvent.name,
						eventTime: privateEvent.eventTime,
						location: privateEvent.location
					})
				])
			);
		});
	});

	describe('Get a single event', () => {
		it('Fails to get an event because invalid ID', async () => {
			try {
				expect(await eventsController.getById('invalidID')).toThrowError();
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid event ID');
			}
		});

		it('Successfully gets a single event', async () => {
			const foundEvent = await eventsController.getById(event._id);
			expect(foundEvent).toEqual(
				expect.objectContaining({
					_id: event._id,
					name: foundEvent.name,
					eventTime: foundEvent.eventTime,
					location: foundEvent.location
				})
			);
		});
	});

	describe('Create an event', () => {
		it('Successfully creates an event', async () => {
			const generatedEvent = generateEvent();
			generatedEvent.privateEvent = false;
			const response = await eventsController.createEvent(generatedEvent);
			expect(response).toHaveProperty('_id');
			expect(response).toEqual(
				expect.objectContaining({
					name: generatedEvent.name,
					eventTime: generatedEvent.eventTime,
					location: generatedEvent.location
				})
			);
		});
	});

	describe('Update an event', () => {
		it('Fails to update an event because invalid id', async () => {
			try {
				const updatedEvent = generateEvent();
				updatedEvent.privateEvent = false;

				const id = 'Invalid ID';
				await eventsController.updateEvent(id, updatedEvent);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid event ID');
			}
		});

		it('Fails to update an event because it doesnt exist', async () => {
			try {
				const updatedEvent = generateEvent();
				updatedEvent.privateEvent = false;

				const id = server.mongoose.Types.ObjectId().toHexString();
				await eventsController.updateEvent(id, updatedEvent);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Event does not exist');
			}
		});

		it('Successfully updates an event', async () => {
			const updatedEvent = generateEvent();
			updatedEvent.privateEvent = false;

			const response = await eventsController.updateEvent(event._id, updatedEvent);
			expect(response).toEqual(
				expect.objectContaining({
					_id: event._id,
					name: updatedEvent.name,
					eventTime: updatedEvent.eventTime,
					location: updatedEvent.location
				})
			);
		});
	});

	describe('Delete an event', () => {
		it('Fails to delete an event because invalid id', async () => {
			try {
				await eventsController.deleteEvent('Invalid ID');
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid event ID');
			}
		});

		it('Fails to delete an event because it doesnt exist', async () => {
			try {
				const id = server.mongoose.Types.ObjectId().toHexString();
				await eventsController.deleteEvent(id);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Event does not exist');
			}
		});

		it('Successfully deletes an event', async () => {
			const response = await eventsController.deleteEvent(event._id);

			const eventAfterDeletion = await Event.findById(event._id);

			expect(eventAfterDeletion).toBeNull();
			expect(response).toEqual(
				expect.objectContaining({
					name: event.name,
					eventTime: event.eventTime,
					location: event.location
				})
			);
		});
	});

	describe('Checkin user to event', () => {
		it('Fails to check in user to event because invalid event id', async () => {
			try {
				const memberID = server.mongoose.Types.ObjectId().toHexString();
				await eventsController.checkin(
					'Invalid id',
					faker.name.findName(),
					faker.internet.email(),
					memberID
				);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid event ID');
			}
		});

		it('Fails to check in user to event because the event doesnt exist', async () => {
			try {
				const eventID = server.mongoose.Types.ObjectId().toHexString();
				const memberID = server.mongoose.Types.ObjectId().toHexString();
				await eventsController.checkin(
					eventID,
					faker.name.findName(),
					faker.internet.email(),
					memberID
				);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Event does not exist');
			}
		});

		it('Fails to check in user to event because the user has no name', async () => {
			try {
				await eventsController.checkin(event._id, null, faker.internet.email(), null);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid name');
			}
		});

		it('Fails to check in user to event because the user has no email', async () => {
			try {
				await eventsController.checkin(event._id, faker.name.findName(), null, null);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid email');
			}
		});

		it('Fails to check in user to event because the user has an invalid email', async () => {
			try {
				await eventsController.checkin(
					event._id,
					faker.name.findName(),
					'invalidEmail',
					null
				);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid email');
			}
		});

		it("Fails to check in user to event because the users email is associated with anothers user's account", async () => {
			try {
				const memberWithTheDifferentName = new Member({ ...generateUser(), name: 'name' });
				await memberWithTheDifferentName.save();

				await eventsController.checkin(
					event._id,
					'differentname',
					memberWithTheDifferentName.email,
					null
				);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual(
					'A member with a different name is associated with this email'
				);
			}
		});

		it('Fails to check in user to event because the user is already checked in', async () => {
			try {
				const user = await createUser();

				await eventsController.checkin(event._id, user.name, user.email, user._id);

				await eventsController.checkin(event._id, user.name, user.email, user._id);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Member already checked in');
			}
		});

		it('Successfully checks in user to event given a user id of a created member', async () => {
			const user = await createUser();

			const updatedEvent = await eventsController.checkin(
				event._id,
				user.name,
				user.email,
				user._id
			);

			const updatedMember = await Member.findById(user._id);

			expect(updatedMember.events).toEqual(expect.arrayContaining([event._id]));
			expect(updatedEvent.members).toEqual(
				expect.arrayContaining([expect.objectContaining({ _id: user._id })])
			);
		});

		it('Successfully checks in user to event given a name and email of an already created member', async () => {
			const user = await createUser();

			const updatedEvent = await eventsController.checkin(
				event._id,
				user.name,
				user.email,
				null
			);

			const updatedMember = await Member.findById(user._id);

			expect(updatedMember.events).toEqual(expect.arrayContaining([event._id]));
			expect(updatedEvent.members).toEqual(
				expect.arrayContaining([expect.objectContaining({ _id: user._id })])
			);
		});

		// it('Successfully checks in user to event given a name and email of a person who doesnt have an account', async () => {
		// 	nock('https://api.sendgrid.com')
		// 		.post('/v3/mail/send')
		// 		.reply(200);

		// 	const member = generateUser();

		// 	const updatedEvent = await eventsController.checkin(
		// 		event._id,
		// 		member.name,
		// 		member.email,
		// 		null
		// 	);

		// 	const createdMemberId = updatedEvent.members[0]._id;
		// 	const updatedMember = await Member.findById(event._id).exec();

		// 	expect(updatedMember.events).toEqual(expect.arrayContaining([event._id]));
		// 	expect(updatedEvent.members).toEqual(
		// 		expect.arrayContaining([expect.objectContaining({ _id: updatedMember._id })])
		// 	);

		// 	nock.restore();
		// });
	});

	describe('Checkout of an event', () => {
		it('Fails to checkout to an event because invalid event id', async () => {
			try {
				const memberID = server.mongoose.Types.ObjectId().toHexString();
				await eventsController.checkout('Invalid id', memberID);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid event ID');
			}
		});

		it('Fails to checkout to an event because event does not exist', async () => {
			try {
				const eventID = server.mongoose.Types.ObjectId().toHexString();
				const memberID = server.mongoose.Types.ObjectId().toHexString();

				await eventsController.checkout(eventID, memberID);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Event does not exist');
			}
		});

		it('Fails to checkout to an event because invalid member id', async () => {
			try {
				const eventID = server.mongoose.Types.ObjectId().toHexString();

				await eventsController.checkout(eventID, 'Invalid member id');
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Invalid member ID');
			}
		});

		it('Fails to checkout to an event because member does not exist', async () => {
			try {
				const memberID = server.mongoose.Types.ObjectId().toHexString();

				await eventsController.checkout(event._id, memberID);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Member does not exist');
			}
		});

		it('Fails to check out member from event because they were never checked in', async () => {
			try {
				const member = await createUser();
				await eventsController.checkout(event._id, member._id);
			} catch (error) {
				expect(error.httpCode).toEqual(400);
				expect(error.message).toEqual('Member is not checked in to this event');
			}
		});

		it('Succesfully checks out member from event', async () => {
			const member = await createUser();

			member.events.push(event);
			event.members.push(member);

			await member.save();
			await event.save();

			const eventAfterCheckout = await eventsController.checkout(event._id, member._id);
			const memberAfterCheckout = await Member.findById(member._id).exec();

			expect(eventAfterCheckout.members.length).toEqual(0);
			expect(memberAfterCheckout.events.length).toEqual(0);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
