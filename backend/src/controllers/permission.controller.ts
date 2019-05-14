import {
	JsonController,
	Get,
	BadRequestError,
	UseAfter,
	Authorized,
	Body,
	Post,
	Param,
	Delete,
	BodyParam,
	CurrentUser
} from 'routing-controllers';
import { ObjectId } from 'mongodb';
import { BaseController } from './base.controller';
import { ValidationMiddleware } from '../middleware/validation';
import { Permission, PermissionDto } from '../models/permission';
import { Member, IMemberModel } from '../models/member';
import { addMemberToPermission, removeMemberFromPermission } from '../utils';

// TODO: Add logic to delete permissons from members document when deleting a permission

@JsonController('/api/permissions')
@UseAfter(ValidationMiddleware)
export class PermissionController extends BaseController {
	@Get('/')
	@Authorized(['permissions'])
	async getAll() {
		const permissions = await Permission.find()
			.where('organizer')
			.ne(0)
			.exec();

		return permissions;
	}

	@Post('/')
	@Authorized(['permissions'])
	async createPermission(@Body() permissionDto: PermissionDto) {
		const permission = new Permission(permissionDto);
		await permission.save();
		return permission;
	}

	@Get('/:id')
	@Authorized(['permissions'])
	async getById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid permission ID');
		const permission = await Permission.findById(id)
			.populate({
				path: 'members.member',
				model: Member
			})
			.populate({
				path: 'members.recordedBy',
				model: Member
			})
			.exec();
		return permission;
	}

	@Delete('/:id')
	@Authorized(['credentials'])
	async deleteById(@Param('id') id: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid credential ID');
		const permission = await Permission.findById(id).exec();
		if (permission) await permission.remove();
		return permission;
	}

	@Post('/:id')
	@Authorized(['permissions'])
	async grantMemberPermission(
		@Param('id') id: string,
		@BodyParam('email') email: string,
		@CurrentUser({ required: true }) user: IMemberModel
	) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid permission ID');
		let [member, permission] = await Promise.all([
			Member.findOne({
				$or: [{ name: email }, { email }]
			}).exec(),
			Permission.findById(id).exec()
		]);

		if (!member) throw new BadRequestError('Member not found');
		if (!permission) throw new BadRequestError('Permission not found');
		[member, permission] = await addMemberToPermission(member, permission, user);
		return {
			permission,
			member
		};
	}

	// TODO: Rewrite so it has same API as grantMemberPermission
	@Delete('/:id/member/:memberID')
	@Authorized(['permissions'])
	async revokeMemberPermission(@Param('id') id: string, @Param('memberID') memberID: string) {
		if (!ObjectId.isValid(id)) throw new BadRequestError('Invalid permission ID');
		if (!ObjectId.isValid(memberID)) throw new BadRequestError('Invalid member ID');

		let [member, permission] = await Promise.all([
			Member.findById(memberID).exec(),
			Permission.findById(id).exec()
		]);

		if (!member) throw new BadRequestError('Member not found');
		if (!permission) throw new BadRequestError('Permission not found');

		[member, permission] = await removeMemberFromPermission(member, permission);

		return {
			permission,
			member
		};
	}
}
