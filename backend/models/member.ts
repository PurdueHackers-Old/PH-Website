import * as bcrypt from 'bcrypt';
import { Document, Schema, model } from 'mongoose';
import { IEventModel } from './event';
import { IPermissionModel } from './permission';
import { IJobModel } from './job';
import { ILocationModel } from './location';
import {
	IsEmail,
	IsEnum,
	Matches,
	IsOptional,
	IsIn,
	IsUrl,
	IsNotEmpty,
	ValidateIf
} from 'class-validator';
import { IsPhoneNumber } from '../validators/phone';
import { Exclude, Expose, Transform } from 'class-transformer';
import { toBoolean, isNotEmpty } from '../utils';

export const genders = {
	MALE: 'Male',
	FEMALE: 'Female',
	OTHER: 'Other',
	NO: 'No'
};

export const majors = [
	'Computer Science',
	'Computer Graphics Technology',
	'Computer Information Technology',
	'Electrical Computer Engineering',
	'Electrical Engineering',
	'First Year Engineering',
	'Math',
	'Mechanical Engineering',
	'Other'
];

@Exclude()
export class MemberDto {
	@IsNotEmpty({ message: 'Please provide your first and last name' })
	@Matches(/([a-zA-Z']+ )+[a-zA-Z']+$/, { message: 'Please provide your first and last name' })
	@Expose()
	name: string;
	@IsNotEmpty({ message: 'Please provide a valid email address' })
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@Expose()
	email: string;
	@IsNotEmpty()
	@Expose()
	graduationYear: number;
	@Exclude()
	password: string;
	@IsOptional()
	@IsEnum(genders, { message: 'Please provide a valid gender' })
	@Expose()
	gender?: string;
	@IsOptional()
	@Transform(toBoolean)
	@Expose()
	unsubscribed?: boolean;
	@IsOptional()
	@Transform(toBoolean)
	@Expose()
	privateProfile?: boolean;
	@ValidateIf(isNotEmpty)
	@IsPhoneNumber('USA', { message: 'Please provide a valid U.S. phone number' })
	@Expose()
	phone?: string;
	setupEmailSent?: Date;
	// @IsOptional()
	@ValidateIf(isNotEmpty)
	@IsIn(majors, { message: 'Please provide a valid major' })
	@Expose()
	major?: string;
	@Expose()
	picture?: string;
	// @IsOptional()
	@ValidateIf(isNotEmpty)
	@Expose()
	description?: string;
	@ValidateIf(isNotEmpty)
	@Matches(/(facebook|fb)/, { message: 'Invalid Facebook URL' })
	@Expose()
	facebook?: string;
	@ValidateIf(isNotEmpty)
	@Matches(/github/, { message: 'Invalid GitHub URL' })
	@Expose()
	github?: string;
	@ValidateIf(isNotEmpty)
	@Matches(/linkedin/, { message: 'Invalid Linkedin URL' })
	@Expose()
	linkedin?: string;
	@ValidateIf(isNotEmpty)
	@Matches(/devpost/, { message: 'Invalid Devpost URL' })
	@Expose()
	devpost?: string;
	@ValidateIf(isNotEmpty)
	@IsUrl({}, { message: 'Invalid website URL' })
	@Expose()
	website?: string;
	@Expose()
	resume?: string;
	@Expose()
	resumeLink?: string;
	authenticatedAt?: Date;
	rememberToken?: string;
	resetPasswordToken?: string;
	comparePassword(password: string) {
		return password && bcrypt.compareSync(password, this.password);
	}
}

export interface IMemberModel extends MemberDto, Document {
	permissions?: IPermissionModel[];
	events?: IEventModel[];
	locations?: {
		location: ILocationModel;
		dateStart: Date;
		dateEnd: Date;
	}[];
	jobs?: IJobModel[];
	createdAt: Date;
	updatedAt: Date;
}

const schema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		email: {
			type: String,
			unique: true,
			required: true
		},
		graduationYear: {
			type: Number,
			default: 0
		},
		password: {
			type: String,
			select: false,
			default: ''
		},
		gender: { type: String },
		unsubscribed: {
			type: Boolean,
			default: false
		},
		privateProfile: {
			type: Boolean,
			default: false
		},
		phone: { type: String },
		major: { type: String },
		picture: { type: String },
		description: { type: String },
		facebook: { type: String },
		github: { type: String },
		linkedin: { type: String },
		devpost: { type: String },
		website: { type: String },
		resume: { type: String },
		resumeLink: { type: String },
		authenticatedAt: { type: String },
		setupEmailSent: { type: String },
		rememberToken: { type: String },
		resetPasswordToken: { type: String },
		permissions: {
			type: [Schema.Types.ObjectId],
			ref: 'Permission',
			default: []
		},
		events: {
			type: [Schema.Types.ObjectId],
			ref: 'Event',
			default: []
		},
		locations: [
			{
				location: {
					type: Schema.Types.ObjectId,
					ref: 'Location'
				},
				dateStart: Date,
				dateEnd: Date
			}
		],
		jobs: {
			type: [Schema.Types.ObjectId],
			ref: 'Job',
			default: []
		}
	},
	{ timestamps: true }
);

schema.pre('save', async function(next) {
	const member = this as IMemberModel;
	if (member.isModified('password') || member.isNew) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(member.password, salt);
			member.password = hash;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
	next();
});

schema.methods.comparePassword = function(password: string) {
	const member = this as IMemberModel;
	return password && bcrypt.compareSync(password, member.password);
};

export const Member = model<IMemberModel>('Member', schema, 'members');
