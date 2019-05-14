import 'jest';
import * as supertest from 'supertest';
import Server from '../../src/server';
import { generateUsers, generateEvent } from '../helper';
import { IMemberModel } from '../../src/models/member';
import { Event, IEventModel } from '../../src/models/event';
import { Member } from '../../src/models/member';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

const signUpUsers = members =>
	Promise.all<{ user: IMemberModel; token: string }>(
		members.map(u =>
			request
				.post('/api/auth/signup')
				.send(u)
				.then(signupResponse => signupResponse.body.response)
		)
	);

describe('Suite: /api/reports', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	describe('Members Report Route Tests', () => {
		it('Successfully returns the major distribution of members', async () => {
			const members: any = generateUsers(6);

			members[0].major = 'Computer Science';
			members[1].major = 'Computer Science';
			members[2].major = 'First Year Engineering';
			members[3].major = 'Math';
			members[4].major = 'Math';
			members[5].major = 'Electrical Computer Engineering';

			await signUpUsers(members);

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			// prettier-ignore
			// so that Math isn't converted to not be a string
			expect(response.majors).toEqual({
				'Math': 2,
				'CS': 2,
				'FYE': 1,
				'ECE': 1
			});
		});

		it('Successfully returns the class distribution of members', async () => {
			const members = generateUsers(6);

			members[1].graduationYear = 2019;
			members[0].graduationYear = 2019;
			members[2].graduationYear = 2019;
			members[3].graduationYear = 2020;
			members[4].graduationYear = 2021;
			members[5].graduationYear = 2022;

			await signUpUsers(members);

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			expect(response.grades).toEqual({
				'2019': 3,
				'2020': 1,
				'2021': 1,
				'2022': 1
			});
		});

		it('Successfully returns the number of new members that joined every month', async () => {
			const members = generateUsers(6);

			// Register all of the users to the database
			const signedUpUsers = await signUpUsers(members);

			// Update each member to have different createdAt dates
			signedUpUsers[0].user.createdAt = new Date('05/20/2018');
			signedUpUsers[1].user.createdAt = new Date('05/20/2018');
			signedUpUsers[2].user.createdAt = new Date('07/20/2017');
			signedUpUsers[3].user.createdAt = new Date('07/20/2017');
			signedUpUsers[4].user.createdAt = new Date('12/20/2016');
			signedUpUsers[5].user.createdAt = new Date('01/20/2016');

			for (const user of signedUpUsers) {
				const databaseUser = await Member.findById(user.user._id).exec();
				databaseUser.createdAt = user.user.createdAt;
				await databaseUser.save();
			}

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			expect(response.numNewMembersPerMonth).toEqual({
				'01/2016': 1,
				'12/2016': 1,
				'07/2017': 2,
				'05/2018': 2
			});
		});

		it('Successfully returns the number of members for each month', async () => {
			const members = generateUsers(6);

			// Register all of the users to the database
			const signedUpUsers = await signUpUsers(members);

			// Update each member to have different createdAt dates
			signedUpUsers[0].user.createdAt = new Date('05/20/2018');
			signedUpUsers[1].user.createdAt = new Date('05/20/2018');
			signedUpUsers[2].user.createdAt = new Date('07/20/2017');
			signedUpUsers[3].user.createdAt = new Date('07/20/2017');
			signedUpUsers[4].user.createdAt = new Date('12/20/2016');
			signedUpUsers[5].user.createdAt = new Date('02/20/2016');

			for (const user of signedUpUsers) {
				const databaseUser = await Member.findById(user.user._id).exec();
				databaseUser.createdAt = user.user.createdAt;
				await databaseUser.save();
			}

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			expect(response.numMembersPerMonth).toEqual({
				'02/2016': 1,
				'12/2016': 2,
				'07/2017': 4,
				'05/2018': 6
			});
		});

		it('Successfully returns the members event attendance', async () => {
			const members = generateUsers(6);

			// Register all of the users to the database
			const signedUpUsers = await signUpUsers(members);
			const events = [new Event(), new Event()];

			signedUpUsers[0].user.events = [];
			signedUpUsers[1].user.events = [];
			signedUpUsers[2].user.events = [events[0]];
			signedUpUsers[3].user.events = [events[0], events[1]];
			signedUpUsers[4].user.events = [events[0], events[1]];
			signedUpUsers[5].user.events = [events[0], events[1]];

			for (const user of signedUpUsers) {
				const databaseUser = await Member.findById(user.user._id).exec();
				databaseUser.events = user.user.events;
				await databaseUser.save();
			}

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			expect(response.membersEventAttendance).toEqual({
				'0': 2,
				'1': 1,
				'2': 3
			});
		});

		it('Successfully returns the event attendance per month', async () => {
			const members = generateUsers(5);

			// Register all of the users to the database
			const signedUpUsersIds = await signUpUsers(members).then(signedUpUsers =>
				signedUpUsers.map(signedUpUser => signedUpUser.user._id)
			);

			// * Date months are 0 index so a month of 12 is actually January
			const events = await [
				new Event({
					...generateEvent(),
					eventTime: new Date('01/20/2016'),
					members: signedUpUsersIds.slice(0, 4)
				}),
				new Event({
					...generateEvent(),
					eventTime: new Date('02/20/2017'),
					members: signedUpUsersIds.slice(0, 3)
				}),
				new Event({
					...generateEvent(),
					eventTime: new Date('05/20/2018'),
					members: signedUpUsersIds.slice(0, 2)
				}),
				new Event({
					...generateEvent(),
					eventTime: new Date('06/20/2018'),
					members: signedUpUsersIds.slice(0, 1)
				})
			].map(event => {
				event.save();
				return event;
			});

			const {
				body: { response },
				status
			} = await request.get('/api/report/members');

			expect(status).toEqual(200);
			expect(response.eventAttendancePerMonth).toEqual({
				'01/2016': 4,
				'02/2017': 3,
				'05/2018': 2,
				'06/2018': 1
			});
		});
	});

	describe('Events Report Route Tests', () => {
		it('Successfully returns the event name', async () => {
			const name = 'test';
			const event = await new Event({
				...generateEvent(),
				name
			}).save();

			const {
				body: { response },
				status
			} = await request.get(`/api/report/event/${event._id}`);

			expect(status).toEqual(200);
			expect(response.eventName).toBe(name);
		});

		it('Successfully returns the major distribution of the members of an event', async () => {
			const members: any = generateUsers(6);

			members[0].major = 'Computer Science';
			members[1].major = 'Computer Science';
			members[2].major = 'First Year Engineering';
			members[3].major = 'Math';
			members[4].major = 'Math';
			members[5].major = 'Electrical Computer Engineering';

			const signedUpUsers = await signUpUsers(members);

			const event = await new Event({
				...generateEvent(),
				members: signedUpUsers.map(user => user.user._id)
			}).save();

			const {
				body: { response },
				status
			} = await request.get(`/api/report/event/${event._id}`);

			expect(status).toEqual(200);
			// prettier-ignore
			// so that Math isn't converted to not be a string
			expect(response.majors).toEqual({
				'Math': 2,
				'CS': 2,
				'FYE': 1,
				'ECE': 1
			});
		});

		it('Successfully returns the grade distribution of the members of an event', async () => {
			const members = generateUsers(6);

			members[1].graduationYear = 2019;
			members[0].graduationYear = 2019;
			members[2].graduationYear = 2019;
			members[3].graduationYear = 2020;
			members[4].graduationYear = 2021;
			members[5].graduationYear = 2022;

			const signedUpUsers = await signUpUsers(members);

			const event = await new Event({
				...generateEvent(),
				members: signedUpUsers.map(user => user.user._id)
			}).save();

			const {
				body: { response },
				status
			} = await request.get(`/api/report/event/${event._id}`);

			expect(status).toEqual(200);
			expect(response.grades).toEqual({
				'2019': 3,
				'2020': 1,
				'2021': 1,
				'2022': 1
			});
		});

		it('Successfully returns the event attendance prior to the event of the members of an event', async () => {
			const members = generateUsers(2);

			// Register all of the users to the database
			const signedUpUsers = await signUpUsers(members);

			const otherEvents = await [
				new Event({ ...generateEvent(), eventTime: new Date(2016, 1) }),
				new Event({ ...generateEvent(), eventTime: new Date(2016, 2) }),
				new Event({ ...generateEvent(), eventTime: new Date(2018, 5) }),
				new Event({ ...generateEvent(), eventTime: new Date(2018, 6) })
			].map(otherEvent => {
				otherEvent.save();
				return otherEvent;
			});

			signedUpUsers[0].user.events = [otherEvents[0]];
			signedUpUsers[1].user.events = [
				otherEvents[0],
				otherEvents[1],
				otherEvents[2],
				otherEvents[3]
			];

			for (const user of signedUpUsers) {
				const databaseUser = await Member.findById(user.user._id).exec();
				databaseUser.events = user.user.events;
				await databaseUser.save();
			}

			const event = await new Event({
				...generateEvent(),
				eventTime: new Date(2017, 1),
				members: signedUpUsers.map(user => user.user._id)
			}).save();

			const {
				body: { response },
				status
			} = await request.get(`/api/report/event/${event._id}`);

			expect(status).toEqual(200);
			expect(response.membersEventAttendancePriorToTheEvent).toEqual({
				'1': 1,
				'2': 1
			});
		});
	});

	it('Successfully returns the current event attendance of the members of an event', async () => {
		const members = generateUsers(2);

		// Register all of the users to the database
		const signedUpUsers = await signUpUsers(members);

		const otherEvents = await [
			new Event({ ...generateEvent(), eventTime: new Date(2016, 1) }),
			new Event({ ...generateEvent(), eventTime: new Date(2016, 2) }),
			new Event({ ...generateEvent(), eventTime: new Date(2018, 5) }),
			new Event({ ...generateEvent(), eventTime: new Date(2018, 6) })
		].map(otherEvent => {
			otherEvent.save();
			return otherEvent;
		});

		signedUpUsers[0].user.events = [otherEvents[0]];
		signedUpUsers[1].user.events = [
			otherEvents[0],
			otherEvents[1],
			otherEvents[2],
			otherEvents[3]
		];

		for (const user of signedUpUsers) {
			const databaseUser = await Member.findById(user.user._id).exec();
			databaseUser.events = user.user.events;
			await databaseUser.save();
		}

		const event = await new Event({
			...generateEvent(),
			eventTime: new Date(2017, 1),
			members: signedUpUsers.map(user => user.user._id)
		}).save();

		const {
			body: { response },
			status
		} = await request.get(`/api/report/event/${event._id}`);

		expect(status).toEqual(200);
		expect(response.membersCurrentEventAttendance).toEqual({
			'1': 1,
			'4': 1
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
