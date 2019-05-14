import 'jest';
import * as faker from 'faker';
import { generateUser, getError } from '../helper';
import { MemberDto, genders, majors } from '../../src/models/member';
import { validate } from 'class-validator';

// const getError = (errors: ValidationError[]) => Object.values(errors[0].constraints).pop();

describe('Member model unit tests', () => {
	it('Successfully creates a member object', async () => {
		const member = new MemberDto();
		Object.assign(member, generateUser());
		const result = await validate(member);
		expect(result.length).toEqual(0);
	});

	describe('Name tests', () => {
		it('Fails because no name', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.name = '';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide your first and last name');
		});

		it('Fails because only first name', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.name = 'FirstName';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide your first and last name');
		});

		it('Fails because numbers in name', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.name = 'FirstName 1234';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide your first and last name');
		});

		it('Succeeds because more than one names', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.name = 'First Second Last';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	describe('Email tests', () => {
		it('Fails because no email', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.email = '';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid email address');
		});

		it('Fails invalid email address', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.email = 'test@testdotcom';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid email address');
		});

		it('Succeeds because valid email', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.email = 'test@test.com';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	describe('Graduation Year tests', () => {
		it('Fails because no graduation year', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			delete member.graduationYear;
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('graduationYear should not be empty');
		});

		it('Succeeds because valid graduation year', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.graduationYear = new Date().getFullYear();
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	// describe('Password tests', () => {
	// 	it('Fails because no password', async () => {
	// 		const member = new MemberDto();
	// 		Object.assign(member, generateUser());
	// 		delete member.password;
	// 		const result = await validate(member);
	// 		expect(result.length).toEqual(1);
	// 		const err = getError(result);
	// 		expect(err).toEqual('A password longer than 5 characters is required');
	// 	});

	// 	it('Fails because password too short', async () => {
	// 		const member = new MemberDto();
	// 		Object.assign(member, generateUser());
	// 		member.password = 'p';
	// 		const result = await validate(member);
	// 		expect(result.length).toEqual(1);
	// 		const err = getError(result);
	// 		expect(err).toEqual('A password longer than 5 characters is required');
	// 	});

	// 	it('Succeeds because valid password', async () => {
	// 		const member = new MemberDto();
	// 		Object.assign(member, generateUser());
	// 		member.password = faker.internet.password(8);
	// 		const result = await validate(member);
	// 		expect(result.length).toEqual(0);
	// 	});
	// });

	describe('Gender tests', () => {
		it('Fails because invalid gender', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.gender = 'Hi';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid gender');
		});

		it('Fails because empty gender', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.gender = '';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid gender');
		});

		it('Succeeds because valid gender', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.gender = Object.values(genders)[
				Math.floor(Math.random() * Object.keys(genders).length)
			];
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	describe('Phone tests', () => {
		it('Fails because invalid phone number', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.phone = '123-456-7890hi';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid U.S. phone number');
		});

		it('Succeeds because empty phone number', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.phone = '';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid phone number', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.phone = '(765)-496-7681';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	describe('Major tests', () => {
		it('Fails because invalid major', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.major = 'InvalidMajor';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Please provide a valid major');
		});

		it('Succeeds because empty major', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.major = '';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid major', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.major = Object.values(majors)[
				Math.floor(Math.random() * Object.keys(majors).length)
			];
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});

	describe('Website tests', () => {
		it('Fails because invalid website', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.website = 'InvalidURL';
			const result = await validate(member);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Invalid website URL');
		});

		it('Succeeds because empty website', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.website = '';
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid website URL', async () => {
			const member = new MemberDto();
			Object.assign(member, generateUser());
			member.website = faker.internet.url();
			const result = await validate(member);
			expect(result.length).toEqual(0);
		});
	});
});
