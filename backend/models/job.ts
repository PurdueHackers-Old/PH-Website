import { Document, Schema, model } from 'mongoose';
import { ILocationModel, Location } from './location';
import { IMemberModel, Member } from './member';
import { IsDate } from '../validators/date';
import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsDefined, ValidateIf } from 'class-validator';
import { isNotEmpty } from '../utils';

export class JobDto {
	@IsNotEmpty({ message: 'Job must have a name' })
	name: string;
	@IsNotEmpty({ message: 'Job must have a city' })
	city: string;
	@IsNotEmpty({ message: 'Job must have a start date' })
	@IsDate({ message: 'Invalid start date' })
	@Type(() => Date)
	start: Date;
	@ValidateIf(isNotEmpty)
	@IsDate({ message: 'Invalid end date' })
	@Type(() => Date)
	end: Date;
	@IsDefined({ message: 'Invalid member id' })
	memberID: string;
}

export interface IJobModel extends Document {
	location: ILocationModel;
	member: IMemberModel;
	start: Date;
	end: Date;
}

const schema = new Schema(
	{
		location: {
			type: Schema.Types.ObjectId,
			ref: 'Location',
			required: true
		},
		member: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
			required: true
		},
		start: {
			type: Date,
			required: true
		},
		end: {
			type: Date
		}
	},
	{ timestamps: true }
);

export const Job = model<IJobModel>('Job', schema, 'jobs');
