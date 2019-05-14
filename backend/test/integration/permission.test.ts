import 'jest';
import * as supertest from 'supertest';
import Server from '../../src/server';
import { ObjectId } from 'mongodb';
import {
	generateCredential,
	generateUser,
	generateCredentials,
	generatePermission,
	generatePermissions
} from '../helper';
import { Member, IMemberModel } from '../../src/models/member';
import { Permission } from '../../src/models/permission';
import CONFIG from '../../src/config';

const createUserWithCredentialPermission = async () => {
	const admin = await request
		.post('/api/auth/signup')
		.send(generateUser())
		.then(response => response.body.response);

	const permission = new Permission({
		name: 'permissions',
		description: 'manage permissions'
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

describe('Suite: /api/permissions', () => {
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
				url: '/api/permissions',
				method: 'get'
			},
			{
				url: '/api/permissions',
				method: 'post'
			},
			{
				url: `/api/permissions/${new ObjectId()}`,
				method: 'get'
			},
			{
				url: `/api/permissions/${new ObjectId()}`,
				method: 'delete'
			},
			{
				url: `/api/permissions/${new ObjectId()}`,
				method: 'post'
			},
			{
				url: `/api/permissions/${new ObjectId()}/member/${new ObjectId()}`,
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

	describe('Create a permission', () => {
		it('Fails to create a permission with no name', async () => {
			const permission = generatePermission();
			delete permission.name;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/permissions`)
				.send(permission)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Permission must have a name');
		});

		it('Fails to create a permission with empty name', async () => {
			const permission = generatePermission();
			permission.name = '';

			const {
				body: { error },
				status
			} = await request
				.post(`/api/permissions`)
				.send(permission)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Permission must have a name');
		});

		it('Fails to create a permission with no description', async () => {
			const permission = generatePermission();
			delete permission.description;

			const {
				body: { error },
				status
			} = await request
				.post(`/api/permissions`)
				.send(permission)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Permission must have a description');
		});

		it('Successfully creates a permission', async () => {
			const permission = generatePermission();

			const {
				body: { response },
				status
			} = await request
				.post(`/api/permissions`)
				.send(permission)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toHaveProperty('_id');
			expect(response).toMatchObject({
				name: permission.name,
				description: permission.description,
				organizer: 1
			});
		});
	});

	describe('Get a permission', () => {
		it('Fails to get a single permission because invalid ID', async () => {
			const {
				body: { error },
				status
			} = await request
				.get(`/api/permissions/invalidID`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid permission ID');
		});

		it('Successfully gets a permission', async () => {
			const permission = new Permission(generatePermission());
			await permission.save();

			const {
				body: { response },
				status
			} = await request
				.get(`/api/permissions/${permission.id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toEqual(
				expect.objectContaining({
					name: permission.name,
					description: permission.description,
					organizer: 1,
					_id: permission.id
				})
			);
		});

		it('Successfully gets a non-existant permission', async () => {
			const {
				body: { response },
				status
			} = await request
				.get(`/api/permissions/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toEqual('');
		});
	});

	describe('Get all permissions', () => {
		it('Successfully gets all permissions', async () => {
			const permissions = generatePermissions(5).map(p => new Permission(p));
			await Promise.all(permissions.map(p => p.save()));

			const {
				body: { response },
				status
			} = await request.get(`/api/permissions`).auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response).toEqual(
				expect.arrayContaining(
					permissions.map(p =>
						expect.objectContaining({
							name: p.name,
							description: p.description,
							organizer: 1
						})
					)
				)
			);
		});
	});

	describe('Grant a member a permission', () => {
		it.each([null, undefined, '', 'invalid'])(
			'Fails to grant a member a permission with no email',
			async email => {
				const permission = new Permission(generatePermission());
				const member = new Member(generateUser());
				await Promise.all([permission.save(), member.save()]);

				const {
					body: { error },
					status
				} = await request
					.post(`/api/permissions/${permission.id}`)
					.send({ email })
					.auth(user.token, { type: 'bearer' });

				expect(status).toEqual(400);
				expect(error).toEqual('Member not found');
			}
		);

		it('Fails to grant a member a permission with invalid ID', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.post(`/api/permissions/invalidID`)
				.send({ email: member.email })
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid permission ID');
		});

		it('Fails to grant a member a permission with unknown permission', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.post(`/api/permissions/${new ObjectId()}`)
				.send({ email: member.email })
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Permission not found');
		});

		it.each(['email', 'name'])('Successfully grants a member a permission', async prop => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { response },
				status
			} = await request
				.post(`/api/permissions/${permission.id}`)
				.send({
					email: member[prop]
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response.member).toBeTruthy();
			expect(response.permission).toBeTruthy();

			expect(response.member).toEqual(
				expect.objectContaining({
					_id: member.id,
					name: member.name,
					email: member.email,
					permissions: [permission.id]
				})
			);

			expect(response.permission).toEqual(
				expect.objectContaining({
					_id: permission.id,
					name: permission.name,
					description: permission.description,
					organizer: 1
				})
			);

			expect(response.permission.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						member: expect.objectContaining({
							_id: member.id,
							name: member.name,
							email: member.email
						}),
						recordedBy: expect.objectContaining({
							_id: user.user._id,
							name: user.user.name,
							email: user.user.email
						})
					})
				])
			);
		});
	});

	describe('Revoke a permission from member', () => {
		it('Fails to revoke a member a permission with non-existant permission', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/permissions/invalidID/member/${member.id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid permission ID');
		});

		it('Fails to revoke a member a permission with non-existant member', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/permissions/${permission.id}/member/invalidID`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Invalid member ID');
		});

		it('Fails to revoke a member a permission with non-existant member', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/permissions/${new ObjectId()}/member/${member.id}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Permission not found');
		});

		it('Fails to revoke a member a permission with non-existant permission', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			const {
				body: { error },
				status
			} = await request
				.delete(`/api/permissions/${permission.id}/member/${new ObjectId()}`)
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(400);
			expect(error).toEqual('Member not found');
		});

		it('Successfully revokes a permission from a member', async () => {
			const permission = new Permission(generatePermission());
			const member = new Member(generateUser());
			await Promise.all([permission.save(), member.save()]);

			let {
				body: { response },
				status
			} = await request
				.post(`/api/permissions/${permission.id}`)
				.send({
					email: member.email
				})
				.auth(user.token, { type: 'bearer' });

			expect(status).toEqual(200);
			expect(response.member).toBeTruthy();
			expect(response.permission).toBeTruthy();

			expect(response.member).toEqual(
				expect.objectContaining({
					_id: member.id,
					name: member.name,
					email: member.email,
					permissions: [permission.id]
				})
			);

			expect(response.permission).toEqual(
				expect.objectContaining({
					_id: permission.id,
					name: permission.name,
					description: permission.description,
					organizer: 1
				})
			);

			expect(response.permission.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						member: expect.objectContaining({
							_id: member.id,
							name: member.name,
							email: member.email
						}),
						recordedBy: expect.objectContaining({
							_id: user.user._id,
							name: user.user.name,
							email: user.user.email
						})
					})
				])
			);

			({
				body: { response },
				status
			} = await request
				.delete(`/api/permissions/${permission.id}/member/${member.id}`)
				.auth(user.token, { type: 'bearer' }));

			expect(status).toEqual(200);
			expect(response.member).toBeTruthy();
			expect(response.permission).toBeTruthy();

			expect(response.member).toEqual(
				expect.objectContaining({
					_id: member.id,
					name: member.name,
					email: member.email,
					permissions: []
				})
			);

			expect(response.permission).toEqual(
				expect.objectContaining({
					_id: permission.id,
					name: permission.name,
					description: permission.description,
					organizer: 1
				})
			);

			expect(response.permission.members).toEqual([]);
		});
	});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
