import {
	JsonController,
	Get,
	BadRequestError,
	UseAfter,
	Body,
	Authorized,
	CurrentUser,
	UnauthorizedError,
	Post,
	Param,
	Delete
} from 'routing-controllers';
import axios from 'axios';
import { ObjectId } from 'bson';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import { Member, IMemberModel } from '../models/member';
import { Location } from '../models/location';
import { Job, JobDto } from '../models/job';
import { memberMatches } from '../utils';

// TODO: Deprecate jobs route and merge with locations
// TODO: Add tests
@JsonController('/api/jobs')
@UseAfter(ValidationMiddleware)
export class JobsController extends BaseController {
	@Get('/')
	async getAll() {
		const jobs = await Job.find()
			.populate(['member', 'location'])
			.exec();
		return jobs;
	}

	@Post('/')
	@Authorized()
	async createJob(@Body() body: JobDto, @CurrentUser() user: IMemberModel) {
		if (!ObjectId.isValid(body.memberID)) throw new BadRequestError('Invalid member id');

		// tslint:disable-next-line:prefer-const
		let [location, member] = await Promise.all([
			Location.findOne({ name: body.name, city: body.city })
				.populate({
					path: 'members.member',
					model: 'Member'
				})
				.exec(),
			Member.findById(body.memberID)
				.populate([
					{
						path: 'permissions',
						model: 'Permission'
					},
					{
						path: 'locations.location',
						model: 'Location'
					}
				])
				.exec()
		]);
		if (!member) throw new BadRequestError('Member does not exist');
		if (!memberMatches(member, user._id)) throw new UnauthorizedError('Unauthorized');

		if (!location) {
			location = new Location({
				name: body.name,
				city: body.city
			});
			const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
				params: {
					address: `${body.name}, ${body.city}`
				}
			});
			if (data.results.length) {
				location.lat = data.results[0].geometry.location.lat;
				location.lng = data.results[0].geometry.location.lng;
			}
			await location.save();
		}

		member.locations.push({
			location,
			dateStart: new Date(body.start),
			dateEnd: body.end ? new Date(body.end) : null
		});

		await Location.findByIdAndUpdate(location._id, {
			$push: {
				members: {
					member,
					dateStart: new Date(body.start),
					dateEnd: body.end ? new Date(body.end) : null
				}
			}
		}).exec();

		const job = new Job({
			location,
			member,
			start: new Date(body.start),
			end: body.end ? new Date(body.end) : null
		});
		await Promise.all([job.save(), member.save(), location.save()]);
		const ret = await job.populate('location').execPopulate();
		return job;
	}

	@Get('/:id')
	async getById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid job id');
		const job = await Job.findById(id).exec();
		return job;
	}

	@Delete('/:id')
	@Authorized()
	async removeById(@Param('id') id: string, @CurrentUser() user: IMemberModel) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid job id');
		const job = await Job.findById(id)
			.populate([
				{
					path: 'member',
					populate: {
						path: 'locations.location',
						model: 'Location'
					}
				},
				{
					path: 'location',
					populate: {
						path: 'members.member',
						model: 'Member'
					}
				}
			])
			.exec();
		if (!job) throw new BadRequestError('Job not found');

		// Remove job from member's list of locations
		job.member.locations = job.member.locations.filter(
			memberLocation =>
				!job.location._id.equals(memberLocation.location._id) &&
				memberLocation.dateStart.getTime() !== job.start.getTime() &&
				memberLocation.dateEnd.getTime() !== job.end.getTime()
		) as any;

		job.location.members = job.location.members.filter(
			locationMember =>
				!job.member._id.equals(locationMember.member._id) &&
				locationMember.dateStart.getTime() !== job.start.getTime() &&
				locationMember.dateEnd.getTime() !== job.end.getTime()
		) as any;

		await job.member.save();
		await job.location.save();

		if (!memberMatches(job.member, user._id)) throw new UnauthorizedError('Unauthorized');
		await job.remove();

		// Remove if there are no more jobs that reference location of job that was just deleted
		const jobs = await Job.find()
			.populate('location')
			.exec();

		const locations = jobs
			.filter(
				j => j.location.name === job.location.name && j.location.city === job.location.city
			)
			.map(j => j.location);

		// No other job is in the same location as the one just deleted, so delete the location
		if (!locations.length) await Location.findByIdAndRemove(job.location._id).exec();

		return job;
	}
}
