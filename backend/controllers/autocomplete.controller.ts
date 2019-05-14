import { JsonController, Get, BadRequestError, UseAfter, QueryParam } from 'routing-controllers';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import { Member } from '../models/member';
import { Location } from '../models/location';
import { escapeRegEx } from '../utils';

@JsonController('/api/autocomplete')
@UseAfter(ValidationMiddleware)
export class AutoCompleteController extends BaseController {
	@Get('/members')
	async getMembers(@QueryParam('term') term: string, @QueryParam('field') field: string) {
		if (!term) throw new BadRequestError('Must have a search term');
		if (!field) throw new BadRequestError('Must have a search field');
		let contains = false;
		Member.schema.eachPath(path => {
			if (path === field) contains = true;
		});
		if (!contains) throw new BadRequestError('Invalid member field');
		const regex = new RegExp(escapeRegEx(term), 'i');
		const members = await Member.find({
			[field]: { $regex: regex, $options: 'i' }
		})
			.sort('-1')
			.limit(5)
			.exec();
		return members;
	}

	@Get('/locations')
	async getLocations(@QueryParam('term') term: string, @QueryParam('field') field: string) {
		if (!term) throw new BadRequestError('Must have a search term');
		if (!field) throw new BadRequestError('Must have a search field');
		if (field !== 'name' && field !== 'city')
			throw new BadRequestError('Location fields can only be either "name" or "city"');
		const regex = new RegExp(escapeRegEx(term));
		const locations = await Location.find({
			[field]: { $regex: regex, $options: 'i' }
		})
			.sort('-1')
			.limit(5)
			.exec();
		return locations;
	}
}
