import axios from 'axios';
import getConfig from 'next/config';
const { publicRuntimeConfig: CONFIG } = getConfig();

export const api = axios.create({
	baseURL: CONFIG.API_URL
});

export const err = e =>
	!e
		? 'Whoops, something went wrong!'
		: e.message && typeof e.message === 'string'
		? e.message
		: e.error && typeof e.error === 'string'
		? e.error
		: 'Whoops, something went wrong!';

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

export const hasPermission = (user, name: string) =>
	user &&
	(Object.keys(user).length !== 0 && user.constructor === Object) &&
	user.permissions.some(per => per.name === name || per.name === 'admin');

export const isAdmin = user => hasPermission(user, 'admin');

export const memberMatches = (user, id) =>
	user && (hasPermission(user, 'admin') || user._id === id);

export const shortName = (name: string) => name.substr(0, 32);
