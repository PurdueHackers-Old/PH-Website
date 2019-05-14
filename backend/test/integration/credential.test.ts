import 'jest';
import * as supertest from 'supertest';
import Server from '../../src/server';
import { ObjectId } from 'mongodb';
import { generateCredential, generateUser, generateCredentials } from '../helper';
import { Member, IMemberModel } from '../../src/models/member';
import { Permission } from '../../src/models/permission';
import CONFIG from '../../src/config';

const createUserWithCredentialPermission = async () => {
	const admin = await request
		.post('/api/auth/signup')
		.send(generateUser())
		.then(response => response.body.response);

	const permission = new Permission({
		name: 'credentials',
		description: 'manage credentials'
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

describe('Suite: /api/credentials', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			request = supertest(s.app);
		})
	);

	beforeEach(async () => {
		user = await createUserWithCredentialPermission();
	});

	describe('Authorization Tests', () => {
		const endpoints = [
			{
				url: '/api/credentials',
				method: 'get'
			},
			{
				url: '/api/credentials',
				method: 'post'
			},
			{
				url: `/api/credentials/${new ObjectId()}`,
				method: 'get'
			},
			{
				url: `/api/credentials/${new ObjectId()}`,
				method: 'delete'
			}
		];
		it.each(endpoints)('Fails because no user', async ({ url, method }) => {
			const {
				body: { error },
				status
			} = await request[method](url);

			expect(error).toEqual('Permission Denied');
			expect(status).toEqual(401);
		});

		it.each(endpoints)('Fails because insufficient permissions', async ({ url, method }) => {
			const member = await request
				.post('/api/auth/signup')
				.send(generateUser())
				.then(response => response.body.response);
			const {
				body: { error },
				status
			} = await request[method](url).auth(member.token, { type: 'bearer' });

			expect(error).toEqual('Permission Denied');
			expect(status).toEqual(401);
		});
	});

	describe('Create a credential', () => {
		it('Fails to create a credential because no site', async () => {
			const credential = generateCredential();
			delete credential.site;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Credential must have a site');
		});

		it('Fails to create a credential because no username', async () => {
			const credential = generateCredential();
			delete credential.username;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Credential must have a username');
		});

		it('Fails to create a credential because no password', async () => {
			const credential = generateCredential();
			delete credential.password;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Credential must have a password');
		});

		it('Successfully creates a credential', async () => {
			const credential = generateCredential();

			const {
				body: { response },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.credential).toMatchObject({
				site: credential.site,
				username: credential.username,
				description: credential.description
			});
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
		});

		it('Successfully creates a credential with no description', async () => {
			const credential = generateCredential();
			delete credential.description;

			const {
				body: { response },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.credential).toMatchObject({
				site: credential.site,
				username: credential.username,
				description: ''
			});
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
		});

		it('Successfully creates a credential with empty description', async () => {
			const credential = generateCredential();
			credential.description = '';

			const {
				body: { response },
				status
			} = await request
				.post(`/api/credentials`)
				.send(credential)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.credential).toMatchObject({
				site: credential.site,
				username: credential.username,
				description: credential.description
			});
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
		});
	});

	describe('Gets all credentials', () => {
		it('Successfully gets all credentials', async () => {
			const credentials = generateCredentials(5);

			await Promise.all(
				credentials.map(credential =>
					request
						.post(`/api/credentials`)
						.send(credential)
						.auth(user.token, { type: 'bearer' })
				)
			);

			const {
				body: { response },
				status
			} = await request.get(`/api/credentials`).auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
			expect(response.credentials).toEqual(
				expect.arrayContaining(
					credentials.map(credential =>
						expect.objectContaining({
							site: credential.site,
							username: credential.username,
							description: credential.description
						})
					)
				)
			);
		});
	});

	describe('Gets a credential', () => {
		it('Fails to get a single credential because invalid ID', async () => {
			const {
				body: { error },
				status
			} = await request
				.get(`/api/credentials/invalidID`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid credential ID');
		});

		it('Successfully gets a non-existant single credential', async () => {
			const {
				body: { response },
				status
			} = await request
				.get(`/api/credentials/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
			expect(response.credential).toBeNull();
		});

		it('Successfully gets a single credential', async () => {
			const credentials = generateCredentials(5);

			const createdCredentials = await Promise.all(
				credentials.map(credential =>
					request
						.post(`/api/credentials`)
						.send(credential)
						.auth(user.token, { type: 'bearer' })
						.then(resp => resp.body.response.credential)
				)
			);

			const randomCredential =
				createdCredentials[
					Math.floor(Math.random() * Object.keys(createdCredentials).length)
				];

			const {
				body: { response },
				status
			} = await request
				.get(`/api/credentials/${randomCredential._id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.credential).toMatchObject({
				_id: randomCredential._id,
				site: randomCredential.site,
				username: randomCredential.username,
				description: randomCredential.description
			});
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
		});
	});

	describe('Deletes a credential', () => {
		it('Fails to delete a single credential because invalid ID', async () => {
			const {
				body: { error },
				status
			} = await request
				.delete(`/api/credentials/invalidID`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid credential ID');
		});

		it('Successfully deletes a non-existant credential', async () => {
			const {
				body: { response },
				status
			} = await request
				.get(`/api/credentials/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('credential');
			expect(response).toHaveProperty('secret');
			expect(response.secret).toEqual(CONFIG.CREDENTIAL_SECRET);
			expect(response.credential).toBeNull();
		});

		it('Successfully deletes a single credential', async () => {
			const credentials = generateCredentials(5);

			const createdCredentials = await Promise.all(
				credentials.map(credential =>
					request
						.post(`/api/credentials`)
						.send(credential)
						.auth(user.token, { type: 'bearer' })
						.then(resp => resp.body.response.credential)
				)
			);

			const randomCredential =
				createdCredentials[
					Math.floor(Math.random() * Object.keys(createdCredentials).length)
				];

			const {
				body: { response },
				status
			} = await request
				.delete(`/api/credentials/${randomCredential._id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toMatchObject({
				_id: randomCredential._id,
				site: randomCredential.site,
				username: randomCredential.username,
				description: randomCredential.description
			});

			const {
				body: { response: res }
			} = await request.get(`/api/credentials`).auth(user.token, { type: 'bearer' });

			expect(res.credentials).toHaveLength(credentials.length - 1);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
