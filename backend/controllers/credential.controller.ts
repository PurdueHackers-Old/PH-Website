import {
	JsonController,
	Get,
	BadRequestError,
	UseAfter,
	Authorized,
	Post,
	Body,
	Param,
	Delete
} from 'routing-controllers';
import { ObjectId } from 'bson';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import CONFIG from '../config';
import { Credential, CredentialDto } from '../models/credential';

@JsonController('/api/credentials')
@UseAfter(ValidationMiddleware)
export class CredentialController extends BaseController {
	@Get('/')
	@Authorized(['credentials'])
	async getAll() {
		const credentials = await Credential.find().exec();
		return {
			credentials,
			secret: CONFIG.CREDENTIAL_SECRET
		};
	}

	@Post('/')
	@Authorized(['credentials'])
	async createCredential(@Body() credentialDto: CredentialDto) {
		const credential = new Credential(credentialDto);
		await credential.save();
		return {
			credential,
			secret: CONFIG.CREDENTIAL_SECRET
		};
	}

	@Get('/:id')
	@Authorized(['credentials'])
	async getById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid credential ID');
		const credential = await Credential.findById(id).exec();
		return {
			credential,
			secret: CONFIG.CREDENTIAL_SECRET
		};
	}

	@Delete('/:id')
	@Authorized(['credentials'])
	async deleteById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid credential ID');
		const credential = await Credential.findById(id).exec();
		if (credential) await credential.remove();
		return credential;
	}
}
