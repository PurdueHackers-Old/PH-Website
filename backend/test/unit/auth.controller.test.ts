import 'jest';
import { Request } from 'express';
import { generateUser } from '../helper';
import Server from '../../src/server';
import { AuthController } from '../../src/controllers/auth.controller';
import { BadRequestError } from 'routing-controllers';

let server: Server;
let controller: AuthController;
describe('Auth controller unit tests', () => {
	beforeAll(() =>
		Server.createInstance().then(s => {
			server = s;
			controller = new AuthController();
		})
	);

	describe('Signup Tests', () => {
		it('Successfully signs up', async () => {
			const member = generateUser();
			const req: Partial<Request> = {
				body: {
					password: member.password,
					passwordConfirm: member.passwordConfirm
				}
			};

			// expect.assertions(1);
			// await expect(controller.signup(req as Request, member as any)).rejects.toEqual(
			// 	new BadRequestError('Please confirm your password')
			// );
			const res = await controller.signup(req as Request, member as any);
			expect(res.token).toBeTruthy();
			expect(res.user).toBeTruthy();
			expect(res.user).toHaveProperty('_id');
			expect(res.user.password).toEqual(undefined);
			expect(res.user.email).toEqual(member.email);
			expect(res.user.graduationYear).toEqual(member.graduationYear);
			expect(res.user.name).toEqual(member.name);
		});
	});

	// describe('Login Tests', () => {});

	afterEach(() => server.mongoose.connection.dropDatabase());

	afterAll(() => server.mongoose.disconnect());
});
