import { Document, Schema, model } from 'mongoose';
import { IMemberModel } from './member';
import { IsNotEmpty } from 'class-validator';

export class LocationDto {
	@IsNotEmpty({ message: 'Location must have a name' })
	name: string;
	@IsNotEmpty({ message: 'Location must have a city' })
	city: string;
}

export interface ILocationModel extends LocationDto, Document {
	loc: any;
	members: {
		member: IMemberModel;
		dateStart: Date;
		dateEnd: Date;
	}[];
	lat: number;
	lng: number;
}

const schema = new Schema(
	{
		loc: {
			type: { type: String },
			coordinates: { type: [], index: '2dsphere' }
		},
		name: {
			type: String
		},
		city: {
			type: String
		},
		members: [
			{
				member: {
					type: Schema.Types.ObjectId,
					ref: 'Member'
				},
				dateStart: Date,
				dateEnd: Date
			}
		],
		lat: { type: Number, default: 0 },
		lng: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

export const Location = model<ILocationModel>('Location', schema, 'locations');
