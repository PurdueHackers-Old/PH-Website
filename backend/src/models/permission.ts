import { Document, Schema, model } from 'mongoose';
import { IMemberModel } from './member';
import { IsNotEmpty } from 'class-validator';

export class PermissionDto {
	@IsNotEmpty({ message: 'Permission must have a name' })
	name: string;
	@IsNotEmpty({ message: 'Permission must have a description' })
	description: string;
}

export interface IPermissionModel extends PermissionDto, Document {
	// name: string;
	// description: string;
	organizer: number;
	members: {
		member: IMemberModel;
		recordedBy: IMemberModel;
		dateAdded: Date;
	}[];
}

const schema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		organizer: {
			type: Number,
			default: 1
		},
		members: [
			{
				member: {
					type: Schema.Types.ObjectId,
					ref: 'Member'
				},
				recordedBy: {
					type: Schema.Types.ObjectId,
					ref: 'Member'
				},
				dateAdded: Date
			}
		]
	},
	{ timestamps: true }
);

export const Permission = model<IPermissionModel>('Permission', schema, 'permissions');
