import { Request } from 'express';
import { isEmail } from 'validator';
import { ObjectId } from 'mongodb';
import { Event, EventDto } from '../models/event';
import { Member, IMemberModel } from '../models/member';
import { hasPermission } from '../utils';
import {
	JsonController,
	Req,
	Get,
	QueryParam,
	CurrentUser,
	Post,
	Authorized,
	Body,
	BadRequestError,
	Param,
	Delete,
	UseAfter,
	BodyParam
} from 'routing-controllers';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import { EmailService } from '../services/email.service';

// TODO: Add auth to routes
// TODO: Add permissions to routess
@JsonController('/api/events')
@UseAfter(ValidationMiddleware)
export class EventsController extends BaseController {
	constructor(private emailService?: EmailService) {
		super();
	}

	@Get('/')
	async getAll(
		@QueryParam('sortBy') sortBy: string,
		@QueryParam('order') order: number,
		@CurrentUser() user: IMemberModel
	) {
		order = order === 1 ? 1 : -1;
		sortBy = sortBy || 'eventTime';
		if (!Event.schema.path(sortBy)) sortBy = 'eventTime';
		let contains = false;
		Event.schema.eachPath(path => {
			if (path.toLowerCase() === sortBy.toLowerCase()) contains = true;
		});
		if (!contains) sortBy = 'eventTime';

		const conditions = hasPermission(user, 'events') ? {} : { privateEvent: { $ne: true } };
		const results = await Event.find(
			conditions,
			'_id name createdAt eventTime location members'
		)
			.sort({ [sortBy]: order })
			.lean()
			.exec();

		return { events: results };
	}

	@Get('/:id')
	async getById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid event ID');
		const event = await Event.findById(id)
			.populate({
				path: 'members',
				model: Member
			})
			.exec();
		return event;
	}

	@Post('/')
	@Authorized(['events'])
	async createEvent(@Body() body: EventDto) {
		const event = new Event(body);
		await event.save();
		return event.toJSON();
	}

	// TODO: Change to put request
	@Post('/:id')
	@Authorized(['events'])
	async updateEvent(@Param('id') id: string, @Body() body: EventDto) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid event ID');
		const event = await Event.findById(id)
			.populate({
				path: 'members',
				model: Member
			})
			.exec();
		if (!event) throw new BadRequestError('Event does not exist');

		// body.privateEvent = `${body.privateEvent}`.toLowerCase() === 'true';
		const updatedEvent = await Event.findByIdAndUpdate(id, body, {
			new: true
		})
			.populate({
				path: 'members',
				model: Member
			})
			.lean()
			.exec();
		return updatedEvent;
	}

	@Delete('/:id')
	@Authorized(['events'])
	async deleteEvent(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid event ID');
		const event = await Event.findById(id).exec();
		if (!event) throw new BadRequestError('Event does not exist');
		await event.remove();
		return event.toJSON();
	}

	// @Post('/:id/checkin')
	// @Authorized(['events'])
	// async checkin(@Req() req: Request) {
	// 	const { name, email, memberID } = req.body;
	// 	if (!ObjectId.isValid(req.params.id)) throw new BadRequestError('Invalid event ID');
	// 	const event = await Event.findById(req.params.id)
	// 		.populate({
	// 			path: 'members',
	// 			model: Member
	// 		})
	// 		.exec();
	// 	if (!event) throw new BadRequestError('Event does not exist');
	// 	let member: IMemberModel = null;

	// 	// Search by memberID
	// 	if (memberID) {
	// 		const m = await Member.findById(memberID).exec();
	// 		if (m && m.email === email) member = m;
	// 	}

	// 	// No ID, so search by name and email
	// 	if (!member) {
	// 		if (!name) throw new BadRequestError('Invalid name');
	// 		if (!email || !isEmail(email)) throw new BadRequestError('Invalid email');
	// 		const m = await Member.findOne({
	// 			name,
	// 			email
	// 		}).exec();
	// 		member = m;
	// 	}

	// 	// New Member
	// 	if (!member) {
	// 		if (await Member.findOne({ email }).exec())
	// 			throw new BadRequestError(
	// 				'A member with a different name is associated with this email'
	// 			);
	// 		member = new Member({
	// 			name,
	// 			email
	// 		});

	// 		await member.save();
	// 		// TODO: Send welcome email when member is created
	// 		await sendAccountCreatedEmail(member, event);
	// 	}
	// 	// Existing Member, If account not setup, send creation email
	// 	else {
	// 		if (member.graduationYear === 0) {
	// 			await sendAccountCreatedEmail(member, event);
	// 		}
	// 	}

	// 	// Check if Repeat
	// 	if (event.members.some(m => m._id.equals(member._id)))
	// 		throw new BadRequestError('Member already checked in');

	// 	event.members.push(member);
	// 	member.events.push(event);
	// 	await Promise.all([event.save(), member.save()]);

	// 	return event;
	// }

	@Post('/:id/checkin')
	@Authorized(['events'])
	async checkin(
		@Param('id') id: string,
		@BodyParam('name') name: string,
		@BodyParam('email') email: string,
		@BodyParam('memberID') memberID: string
	) {
		// const { name, email, memberID } = req.body;
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid event ID');
		const event = await Event.findById(id)
			.populate({
				path: 'members',
				model: Member
			})
			.exec();
		if (!event) throw new BadRequestError('Event does not exist');
		let member: IMemberModel = null;

		// Search by memberID
		if (memberID) {
			const m = await Member.findById(memberID).exec();
			if (m && m.email === email) member = m;
		}

		// No ID, so search by name and email
		if (!member) {
			if (!name) throw new BadRequestError('Invalid name');
			if (!email || !isEmail(email)) throw new BadRequestError('Invalid email');
			const m = await Member.findOne({
				name,
				email
			}).exec();
			member = m;
		}

		// New Member
		if (!member) {
			if (await Member.findOne({ email }).exec())
				throw new BadRequestError(
					'A member with a different name is associated with this email'
				);
			member = new Member({
				name,
				email
			});

			await member.save();
			// TODO: Send welcome email when member is created
			await this.emailService.sendAccountCreatedEmail(member, event);
		}
		// Existing Member, If account not setup, send creation email
		else if (member.graduationYear === 0) {
			await this.emailService.sendAccountCreatedEmail(member, event);
		}

		// Check if Repeat
		if (event.members.some(m => m._id.equals(member._id)))
			throw new BadRequestError('Member already checked in');

		event.members.push(member);
		member.events.push(event);
		await Promise.all([event.save(), member.save()]);

		return event;
	}

	// TODO: Checkout member based on their name and email
	@Delete('/:id/checkin/:memberID')
	@Authorized(['events'])
	async checkout(@Param('id') id: string, @Param('memberID') memberID: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid event ID');
		if (!ObjectId.isValid(memberID)) throw new BadRequestError('Invalid member ID');
		const [event, member] = await Promise.all([
			Event.findById(id).exec(),
			Member.findById(memberID).exec()
		]);
		if (!event) throw new BadRequestError('Event does not exist');
		if (!member) throw new BadRequestError('Member does not exist');

		// Check if not already checked in
		if (!event.members.some(m => m._id.equals(member._id)))
			throw new BadRequestError('Member is not checked in to this event');

		// Remove member and event fom each other
		event.members = event.members.filter(m => !m._id.equals(member._id));
		member.events = member.events.filter(e => !e._id.equals(event._id));
		await Promise.all([event.save(), member.save()]);

		return event;
	}
}
