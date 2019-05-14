import * as faker from 'faker';
import { ValidationError } from 'class-validator';

export const generateUser = () => {
	const first = faker.name.firstName();
	const last = faker.name.lastName();
	const domain = faker.internet.domainName();
	const email = faker.internet.email(first, last, domain);

	const password = faker.internet.password(8);
	return {
		name: `${first} ${last}`,
		email,
		graduationYear: faker.random.number({
			min: 1900,
			max: 2025
		}),
		password,
		passwordConfirm: password
	};
};

export const generateEvent = () => {
	const name = faker.hacker.noun();
	const eventTime = faker.date.past();
	const location = faker.address.streetAddress();
	const facebook = `https://www.facebook.com/events/${faker.random.number({
		min: 100000000000000,
		max: 999999999999999
	})}/`;
	const privateEvent = faker.random.boolean();
	return {
		name,
		eventTime,
		location,
		facebook,
		privateEvent
	};
};

export const generateCredential = () => {
	const site = faker.internet.url();
	const username = faker.internet.userName();
	const password = faker.internet.password();
	const description = faker.lorem.sentence();
	return {
		site,
		username,
		password,
		description
	};
};

export const generatePermission = () => {
	const name = faker.lorem.word();
	const description = faker.lorem.sentence();
	return {
		name,
		description
	};
};

export const generateLocation = () => {
	const name = faker.lorem.word();
	const city = faker.address.city();
	return {
		name,
		city
	};
};

const spoofFacebookEvent = () => {
	const startTime = faker.date.future();
	const name = faker.hacker.noun();
	const place = {
		name: faker.address.city()
	};

	// Don't set id, just in case two events generate the same random number
	return {
		name,
		place,
		start_time: startTime
	};
};

export const spoofFacebookEvents = (num: number) =>
	Array.from({ length: num }, (v, i) => ({ ...spoofFacebookEvent(), id: i }));

export const generateUsers = (num: number) => Array.from({ length: num }, generateUser);

export const generateEvents = (num: number) => Array.from({ length: num }, generateEvent);

export const generateCredentials = (num: number) => Array.from({ length: num }, generateCredential);

export const generatePermissions = (num: number) => Array.from({ length: num }, generatePermission);

export const generateLocations = (num: number) => Array.from({ length: num }, generateLocation);

export const getError = (errors: ValidationError[]) => Object.values(errors[0].constraints).pop();

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));
