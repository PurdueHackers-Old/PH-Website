import 'jest';
import 'reflect-metadata';
import { generateEvent, getError } from '../helper';
import { EventDto } from '../../src/models/event';
import { validate, ValidationError } from 'class-validator';

// const getError = (errors: ValidationError[]) => Object.values(errors[0].constraints).pop();

describe('Event model unit tests', () => {
	it('Successfully creates an event object', async () => {
		const event = new EventDto();
		Object.assign(event, generateEvent());
		const result = await validate(event);
		expect(result.length).toEqual(0);
	});

	describe('Name tests', () => {
		it('Fails because no name', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.name = '';
			const result = await validate(event);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Event must have a name');
		});

		it('Succeeds because valid name', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.name = 'Valid Event Name';
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});
	});

	describe('Location tests', () => {
		it('Fails because no location', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.location = '';
			const result = await validate(event);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Event must have a location');
		});

		it('Succeeds because valid location', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.location = 'Location';
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});
	});

	describe('Time tests', () => {
		it('Fails because no time', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			delete event.eventTime;
			const result = await validate(event);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Event must have a time');
		});

		it('Fails because time isnt a date', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.eventTime = new Date('Not A Date');
			const result = await validate(event);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Event must have a time');
		});

		it('Succeeds because valid time', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.eventTime = new Date();
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid time', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.eventTime = new Date();
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});
	});

	describe('Facebook tests', () => {
		it('Fails because invalid facebook url', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.facebook = 'www.google.com';
			const result = await validate(event);
			expect(result.length).toEqual(1);
			const err = getError(result);
			expect(err).toEqual('Must specify a url from Facebook');
		});

		it('Succeeds because empty facebook url', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			delete event.facebook;
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid facebook url', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.facebook = 'https://www.facebook.com/randomotherlink';
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});
	});

	describe('Private event tests', () => {
		it('Succeeds because empty private event field', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			delete event.privateEvent;
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});

		it('Succeeds because valid private event field', async () => {
			const event = new EventDto();
			Object.assign(event, generateEvent());
			event.privateEvent = true;
			const result = await validate(event);
			expect(result.length).toEqual(0);
		});
	});
});
