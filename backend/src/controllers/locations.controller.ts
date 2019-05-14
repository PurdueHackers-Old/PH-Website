import {
	JsonController,
	Get,
	BadRequestError,
	UseAfter,
	Param,
	Post,
	Body,
	Authorized
} from 'routing-controllers';
import { ObjectId } from 'bson';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import { Location, LocationDto } from '../models/location';

// TODO: Add tests
@JsonController('/api/locations')
@UseAfter(ValidationMiddleware)
export class LocationsController extends BaseController {
	@Get('/')
	async getAll() {
		const locations = await Location.find()
			.populate({
				path: 'members'
			})
			.exec();

		return locations;
	}

	@Get('/:id')
	async getById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid location ID');
		const location = await Location.findById(id)
			.populate({
				path: 'members.member'
			})
			.exec();
		return location;
	}

	@Post('/:id')
	@Authorized(['admin'])
	async updateById(@Param('id') id: string, @Body() body: LocationDto) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid location ID');
		const location = await Location.findById(id)
			.populate({
				path: 'members.member'
			})
			.exec();
		if (!location) throw new BadRequestError('Location does not exist');
		location.name = body.name;
		location.city = body.city;
		await location.save();
		return location;
	}
}
