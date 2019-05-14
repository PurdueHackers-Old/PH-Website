import { Document, Schema, model } from 'mongoose';
import { Type, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { IMemberModel } from './member';
import { IsDate } from '../validators/date';
import { toBoolean } from '../utils';

export class EventDto {
	@IsNotEmpty({ message: 'Event must have a name' })
	name: string;
	@IsNotEmpty({ message: 'Event must have a location' })
	location: string;

	@IsNotEmpty({ message: 'Event must have a time' })
	@IsDate({ message: 'Event must have a time' })
	@Type(() => Date)
	// @IsDate({ message: 'Event must have a time' })
	eventTime: Date;
	// eventTime: string;
	@IsOptional()
	@Matches(new RegExp('((http|https)://)?(www[.])?facebook.com.*'), {
		message: 'Must specify a url from Facebook'
	})
	facebook: string;
	@IsOptional()
	@Transform(toBoolean)
	privateEvent: boolean;
}

export interface IEventModel extends EventDto, Document {
	// name: string;
	// location: string;
	// facebook: string;
	// eventTime: Date;
	// privateEvent: boolean;
	members: IMemberModel[];
	createdAt: Date;
	updatedAt: Date;
}

const schema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		location: {
			type: String,
			required: true
		},
		eventTime: {
			type: Date,
			required: true
		},
		members: {
			type: [Schema.Types.ObjectId],
			ref: 'Member',
			default: []
		},
		facebook: {
			type: String,
			default: ''
		},
		privateEvent: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

export const Event = model<IEventModel>('Event', schema, 'events');
