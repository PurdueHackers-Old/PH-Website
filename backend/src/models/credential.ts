import { AES, enc } from 'crypto-js';
import { Document, Schema, model } from 'mongoose';
import CONFIG from '../config';
import { IsUrl, IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { isNotEmpty } from '../utils';

export class CredentialDto {
	@IsNotEmpty({ message: 'Credential must have a site' })
	site: string;
	@IsNotEmpty({ message: 'Credential must have a username' })
	username: string;
	@IsNotEmpty({ message: 'Credential must have a password' })
	password: string;
	description: string;
}

export interface ICredentialModel extends CredentialDto, Document {
	createdAt: Date;
	updatedAt: Date;
}

const schema = new Schema(
	{
		site: {
			type: String,
			default: '',
			required: true
		},
		username: {
			type: String,
			default: '',
			required: true
		},
		password: {
			type: String,
			default: '',
			required: true
		},
		description: {
			type: String,
			default: ''
		}
	},
	{ timestamps: true }
);

schema.pre('save', function(next) {
	const cred = this as ICredentialModel;
	if (this.isModified('password') || this.isNew) {
		try {
			cred.password = AES.encrypt(cred.password, CONFIG.CREDENTIAL_SECRET, {}).toString();
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	next();
});

// tslint:disable-next-line:only-arrow-functions
schema.post('findOne', function(err, credential: ICredentialModel, next) {
	try {
		credential.password = AES.decrypt(credential.password, CONFIG.CREDENTIAL_SECRET).toString(
			enc.Utf8
		);
		next();
	} catch (error) {
		console.error(error);
		next(error);
	}
});

export const Credential = model<ICredentialModel>('Credential', schema, 'credentials');
