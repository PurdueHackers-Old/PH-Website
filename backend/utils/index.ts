import { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import * as Multer from 'multer';
import { ExtractJwt } from 'passport-jwt';
import { IMemberModel, Member } from '../models/member';
import { Permission, IPermissionModel } from '../models/permission';
// export * from './email';

export const multer = Multer({
	storage: Multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
	}
});

export const successRes = (res: Response, response: any) => res.json({ status: 200, response });

export const errorRes = (res: Response, status: number, error: any) =>
	res.status(status).json({
		status,
		error
	});

// export const hasPermission = (user: IMemberModel, name: string) =>
// 	user.permissions.some(per => per.name === name || per.name === 'admin');

export const hasPermission = (user, name: string): boolean =>
	user &&
	user.permissions &&
	// (Object.keys(user).length !== 0 && user.constructor === Object) &&
	user.permissions.some(per => per.name === name || per.name === 'admin');

export const isAdmin = user => hasPermission(user, 'admin');

export const memberMatches = (user, id: ObjectId | string) =>
	user &&
	(hasPermission(user, 'admin') ||
		user._id === id ||
		(typeof user._id.equals === 'function' && user._id.equals(id)));

export const escapeRegEx = (str: string) =>
	str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

const dateToString = date =>
	new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		weekday: 'short'
	});

export const formatDate = date => {
	if (!date) return 'Current';
	const str = dateToString(date);
	return str !== 'Invalid Date' ? str : 'Current';
};

export function to<T, U = any>(
	promise: Promise<T>,
	errorExt?: object
): Promise<[T | null, U | null]> {
	return promise
		.then<[T, null]>((data: T) => [data, null])
		.catch<[null, U]>(err => {
			if (errorExt) Object.assign(err, errorExt);

			return [null, err];
		});
}

export const addMemberToPermission = async (
	member: IMemberModel,
	permission: IPermissionModel,
	user: IMemberModel
) =>
	Promise.all([
		Member.findByIdAndUpdate(
			member._id,
			{
				$push: {
					permissions: permission._id
				}
			},
			{ new: true }
		).exec(),
		Permission.findByIdAndUpdate(
			permission._id,
			{
				$push: {
					members: {
						member: member._id,
						recordedBy: user._id,
						dateAdded: new Date()
					}
				}
			},
			{ new: true }
		)
			.populate({
				path: 'members.member',
				model: Member
			})
			.populate({
				path: 'members.recordedBy',
				model: Member
			})
			.exec()
	]);

export const removeMemberFromPermission = (member: IMemberModel, permission: IPermissionModel) =>
	Promise.all([
		Member.findByIdAndUpdate(
			member._id,
			{
				$pull: {
					permissions: permission._id
				}
			},
			{ new: true }
		).exec(),
		Permission.findByIdAndUpdate(
			permission._id,
			{
				$pull: {
					members: {
						member: member._id
					}
				}
			},
			{ new: true }
		)
			.populate({
				path: 'members.member',
				model: Member
			})
			.populate({
				path: 'members.recordedBy',
				model: Member
			})
			.exec()
	]);

export const addMemberToPermissions = async (
	member: IMemberModel,
	permissions: IPermissionModel[],
	user
) => {
	let p;
	const perms = [];
	for (const permission of permissions) {
		[member, p] = await addMemberToPermission(member, permission, user);
		perms.push(p);
	}

	return [member, perms];
};

export const toBoolean = (val: any, obj: any, type) => `${val}`.toLowerCase() === 'true';

export const isNotEmpty = (obj: any, val: any) => val !== '' && val !== null && val !== undefined;

export const extractToken = (req: Request) =>
	ExtractJwt.fromExtractors([
		ExtractJwt.fromAuthHeaderAsBearerToken(),
		ExtractJwt.fromBodyField('token'),
		ExtractJwt.fromHeader('token'),
		ExtractJwt.fromUrlQueryParameter('token')
	])(req);
