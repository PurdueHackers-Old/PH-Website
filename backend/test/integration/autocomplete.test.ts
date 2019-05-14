import 'jest';
import * as supertest from 'supertest';
import Server from '../../src/server';
import { generateUser, generateUsers } from '../helper';
import { IMemberModel } from '../../src/models/member';
import { Location, ILocationModel } from '../../src/models/location';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
// let members: { user: IMemberModel; token: string }[];
// let user: { user: IMemberModel; token: string };

describe('Autocomplete route tests', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	describe('Members Tests', () => {
		it('Fails because no term', async () => {
			const query = {
				field: 'name'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Must have a search term');
		});

		it('Fails because no field', async () => {
			const query = {
				term: 'test'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Must have a search field');
		});

		it('Fails because invalid field', async () => {
			const query = {
				term: 'test',
				field: 'invalid field'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Invalid member field');
		});

		it('Successfully queries by member first name', async () => {
			const user: { user: IMemberModel; token: string } = await request
				.post('/api/auth/signup')
				.send({
					name: 'Test Testerson',
					email: 'test@test.com',
					graduationYear: new Date().getFullYear(),
					password: '1234567890',
					passwordConfirm: '1234567890'
				})
				.then(res => res.body.response);

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(1);
			const returnedUser = response[0];
			expect(returnedUser._id).toEqual(user.user._id);
			expect(returnedUser.name).toEqual(user.user.name);
			expect(returnedUser.email).toEqual(user.user.email);
			expect(returnedUser.graduationYear).toEqual(user.user.graduationYear);
		});

		it('Successfully queries by member first name (case insensitive)', async () => {
			const user: { user: IMemberModel; token: string } = await request
				.post('/api/auth/signup')
				.send({
					name: 'Test Testerson',
					email: 'test@test.com',
					graduationYear: new Date().getFullYear(),
					password: '1234567890',
					passwordConfirm: '1234567890'
				})
				.then(res => res.body.response);

			const query = {
				term: 'tEsT',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(1);
			const returnedUser = response[0];
			expect(returnedUser).toBeTruthy();
			expect(returnedUser._id).toEqual(user.user._id);
			expect(returnedUser.name).toEqual(user.user.name);
			expect(returnedUser.email).toEqual(user.user.email);
			expect(returnedUser.graduationYear).toEqual(user.user.graduationYear);
		});

		it('Successfully queries multiple members by first name', async () => {
			const MEMBER_LENGTH = 3;
			const members: { user: IMemberModel; token: string }[] = await Promise.all(
				['ONE', 'TWO', 'THREE'].map(val =>
					request
						.post('/api/auth/signup')
						.send({
							name: `Test Testerson${val}`,
							email: `test${val}@test.com`,
							graduationYear: new Date().getFullYear(),
							password: '1234567890',
							passwordConfirm: '1234567890'
						})
						.then(res => res.body.response)
				)
			);

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(MEMBER_LENGTH);

			members.forEach(user => {
				const returnedUser = response.find((m: IMemberModel) => m._id === user.user._id);
				expect(returnedUser).toBeTruthy();
				expect(returnedUser._id).toEqual(user.user._id);
				expect(returnedUser.name).toEqual(user.user.name);
				expect(returnedUser.email).toEqual(user.user.email);
				expect(returnedUser.graduationYear).toEqual(user.user.graduationYear);
			});
		});

		it('Successfully queries more than 5 members by first name', async () => {
			const members: { user: IMemberModel; token: string }[] = await Promise.all(
				['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].map(val =>
					request
						.post('/api/auth/signup')
						.send({
							name: `Test Testerson${val}`,
							email: `test${val}@test.com`,
							graduationYear: new Date().getFullYear(),
							password: '1234567890',
							passwordConfirm: '1234567890'
						})
						.then(res => res.body.response)
				)
			);

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/members').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(5);

			response.forEach((returnedUser: IMemberModel) => {
				const user = members.find(member => returnedUser._id === member.user._id);
				expect(returnedUser).toBeTruthy();
				expect(returnedUser._id).toEqual(user.user._id);
				expect(returnedUser.name).toEqual(user.user.name);
				expect(returnedUser.email).toEqual(user.user.email);
				expect(returnedUser.graduationYear).toEqual(user.user.graduationYear);
			});
		});
	});

	describe('Locations Tests', () => {
		it('Fails because no term', async () => {
			const query = {
				field: 'name'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Must have a search term');
		});

		it('Fails because no field', async () => {
			const query = {
				term: 'test'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Must have a search field');
		});

		it('Fails because invalid field', async () => {
			const query = {
				term: 'test',
				field: 'invalid field'
			};
			const {
				body: { error },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(400);
			expect(error).toEqual('Location fields can only be either "name" or "city"');
		});

		it('Successfully queries location by name', async () => {
			const location = new Location({
				name: 'Test Name',
				city: 'Lafayette'
			});

			await location.save();

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);

			expect(status).toEqual(200);
			expect(response).toHaveLength(1);
			const returnedLocation = response[0];
			expect(returnedLocation._id).toEqual(location.id);
			expect(returnedLocation.name).toEqual(location.name);
			expect(returnedLocation.city).toEqual(location.city);
		});

		it('Successfully queries location by name', async () => {
			const location = new Location({
				name: 'Test Name',
				city: 'Lafayette'
			});

			await location.save();

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);

			expect(status).toEqual(200);
			expect(response).toHaveLength(1);
			const returnedLocation = response[0];
			expect(returnedLocation).toBeTruthy();
			expect(returnedLocation._id).toEqual(location.id);
			expect(returnedLocation.name).toEqual(location.name);
			expect(returnedLocation.city).toEqual(location.city);
		});

		it('Successfully queries location by city', async () => {
			const location = new Location({
				name: 'Test Name',
				city: 'Lafayette'
			});

			await location.save();

			const query = {
				term: 'Laf',
				field: 'city'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);

			expect(status).toEqual(200);
			expect(response).toHaveLength(1);
			const returnedLocation = response[0];
			expect(returnedLocation).toBeTruthy();
			expect(returnedLocation._id).toEqual(location.id);
			expect(returnedLocation.name).toEqual(location.name);
			expect(returnedLocation.city).toEqual(location.city);
		});

		it('Successfully queries multiple locations by name', async () => {
			const LOCATIONS_LENGTH = 3;
			const locations = ['ONE', 'TWO', 'THREE'].map(
				val =>
					new Location({
						name: `Test Name${val}`,
						city: 'Lafayette'
					})
			);

			await Promise.all(locations.map(loc => loc.save()));

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(LOCATIONS_LENGTH);

			locations.forEach(location => {
				const returnedLocation = response.find(
					(loc: ILocationModel) => loc._id === location.id
				);
				expect(returnedLocation).toBeTruthy();
				expect(returnedLocation._id).toEqual(location.id);
				expect(returnedLocation.name).toEqual(location.name);
				expect(returnedLocation.city).toEqual(location.city);
			});
		});

		it('Successfully queries more than 5 locations by name', async () => {
			const locations = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].map(
				val =>
					new Location({
						name: `Test Name${val}`,
						city: 'Lafayette'
					})
			);

			await Promise.all(locations.map(loc => loc.save()));

			const query = {
				term: 'Test',
				field: 'name'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(5);

			response.forEach((returnedLocation: ILocationModel) => {
				const location = locations.find(
					(loc: ILocationModel) => loc.id === returnedLocation._id
				);
				expect(returnedLocation).toBeTruthy();
				expect(returnedLocation._id).toEqual(location.id);
				expect(returnedLocation.name).toEqual(location.name);
				expect(returnedLocation.city).toEqual(location.city);
			});
		});

		it('Successfully queries more than 5 locations by city', async () => {
			const locations = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'].map(
				val =>
					new Location({
						name: 'Test Name',
						city: `Lafayette${val}`
					})
			);

			await Promise.all(locations.map(loc => loc.save()));

			const query = {
				term: 'Laf',
				field: 'city'
			};
			const {
				body: { response },
				status
			} = await request.get('/api/autocomplete/locations').query(query);
			expect(status).toEqual(200);
			expect(response).toHaveLength(5);

			response.forEach((returnedLocation: ILocationModel) => {
				const location = locations.find(
					(loc: ILocationModel) => loc.id === returnedLocation._id
				);
				expect(returnedLocation).toBeTruthy();
				expect(returnedLocation._id).toEqual(location.id);
				expect(returnedLocation.name).toEqual(location.name);
				expect(returnedLocation.city).toEqual(location.city);
			});
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
