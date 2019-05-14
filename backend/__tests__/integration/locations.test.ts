import 'jest';
import * as supertest from 'supertest';
import Server from '../../src/server';
import { IMemberModel, Member } from '../../src/models/member';
import { Location, ILocationModel } from '../../src/models/location';
import { generateLocation, generateLocations, generateUser } from '../helper';
import { ObjectId } from 'bson';
import { Permission } from '../../src/models/permission';

const createUserWithAdminCreationPermission = async () => {
	const admin = await request
		.post('/api/auth/signup')
		.send(generateUser())
		.then(response => response.body.response);

	const permission = new Permission({
		name: 'admin',
		description: 'admin'
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
// let members: { user: IMemberModel; token: string }[];
let user: { user: IMemberModel; token: string };

describe('Locations route tests', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	describe('Get a single location', () => {
		it('Fails to query invalid location', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { error },
				status
			} = await request.get(`/api/locations/invalidID`);

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid location ID');
		});

		it('Successfully queries location by id', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { response },
				status
			} = await request.get(`/api/locations/${location.id}`);

			expect(status).toEqual(200);
			expect(response._id).toEqual(location.id);
			expect(response.name).toEqual(location.name);
			expect(response.city).toEqual(location.city);
		});

		it('Successfully queries null location', async () => {
			const {
				body: { response },
				status
			} = await request.get(`/api/locations/${new ObjectId()}`);

			expect(status).toEqual(200);
			expect(response).toEqual('');
		});
	});

	describe('Get all locations', () => {
		it('Successfully queries all locations w/ none created', async () => {
			const {
				body: { response },
				status
			} = await request.get(`/api/locations`);

			expect(status).toEqual(200);
			expect(response).toHaveLength(0);
			expect(response).toEqual([]);
		});

		it('Successfully queries all locations', async () => {
			const locations = generateLocations(5).map(loc => new Location(loc));
			await Promise.all(locations.map(loc => loc.save()));

			const {
				body: { response },
				status
			} = await request.get(`/api/locations`);

			expect(status).toEqual(200);
			expect(response).toHaveLength(locations.length);
			expect(response).toEqual(
				expect.arrayContaining(
					locations.map(loc =>
						expect.objectContaining({
							_id: loc.id,
							name: loc.name,
							city: loc.city
						})
					)
				)
			);
		});
	});

	describe('Update a single location', () => {
		beforeEach(async () => {
			user = await createUserWithAdminCreationPermission();
		});

		it('Fails to update location because unauthorized', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { error },
				status
			} = await request.post(`/api/locations/${location.id}`).send(location);

			expect(status).toEqual(401);
			expect(error).toEqual('Permission Denied');
		});

		it('Fails to update invalid location', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/locations/invalidID`)
				.auth(user.token, { type: 'bearer' })
				.send(location);

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid location ID');
		});

		it('Fails to update non-existing location', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { error },
				status
			} = await request
				.post(`/api/locations/${new ObjectId()}`)
				.send(location)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Location does not exist');
		});

		it('Successfully updates a location', async () => {
			const location = new Location(generateLocation());
			await location.save();

			const {
				body: { response },
				status
			} = await request
				.post(`/api/locations/${location.id}`)
				.send({
					name: 'Changed',
					city: location.city
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response._id).toEqual(location.id);
			expect(response.name).toEqual('Changed');
			expect(response.city).toEqual(location.city);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
