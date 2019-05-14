import * as passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import CONFIG from '../config';
import { Member, IMemberModel } from '../models/member';
import { Permission } from '../models/permission';
import { errorRes, hasPermission, extractToken } from '../utils';
import { ObjectId } from 'bson';

passport.serializeUser<any, any>((user, done) => {
	console.log('Passport serialize user:', user);
	done(undefined, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await Member.findById(id)
			.populate({
				path: 'permissions',
				model: Permission
			})
			.exec();
		console.log('Passport serialize user:', user);
		done(null, user as IMemberModel);
	} catch (error) {
		done(error, undefined);
	}
});

export default (pass: any) =>
	pass.use(
		new Strategy(
			{
				// jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
				jwtFromRequest: extractToken,
				secretOrKey: CONFIG.SECRET
			},
			async (payload, done) => {
				try {
					if (!payload || !payload._id || !ObjectId.isValid(payload._id))
						return done(null, false);
					const user = await Member.findById(payload._id)
						.populate({
							path: 'permissions',
							model: Permission
						})
						.lean()
						.exec();
					return user ? done(null, user) : done(null, false);
				} catch (error) {
					console.error('Strategy error:', error);
					return done(error, false);
				}
			}
		)
	);

export const auth = () => (req: Request, res: Response, next: NextFunction) =>
	req.user ? next() : errorRes(res, 401, 'Unauthorized');

export const extractUser = () => (req: Request, res: Response, next: NextFunction) =>
	passport.authenticate('jwt', { session: true }, (err, data, info) => {
		req.user = data || null;
		next();
	})(req, res, next);

export const hasPermissions = (roles: string[]) => (
	req: Request,
	res: Response,
	next: NextFunction
) =>
	!req.user || !roles.some(role => hasPermission(req.user, role))
		? errorRes(res, 401, 'Permission Denied')
		: next();
