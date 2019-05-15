import { getToken } from '../utils/session';
import { api } from '../utils';
import { IContext } from '../@types';

export const fetchMembers = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/members', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchMember = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/members/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const addOrganizer = async (email: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(
			'/members/organizer',
			{ email },
			{
				headers: { Authorization: `Bearer ${token}` }
			}
		);
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchMemberEvents = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/members/${id}/events`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchMemberJobs = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/members/${id}/jobs`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchEvents = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/events', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchEvent = async (id, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/events/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const createEvent = async (event, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post('/events/', event, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const updateEvent = async (id, event, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(`/events/${id}`, event, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const deleteEvent = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/events/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const checkinEvent = async (id, name, email, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(
			`/events/${id}/checkin`,
			{
				name,
				email
			},
			{
				headers: { Authorization: `Bearer ${token}` }
			}
		);
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const checkoutEvent = async (id, memberID, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/events/${id}/checkin/${memberID}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchCredentials = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/credentials', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const addCredential = async (credential, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post('/credentials', credential, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const deleteCredential = async (id, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/credentials/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchPermissions = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/permissions', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchPermission = async (id, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/permissions/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const addPermission = async (permission, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post('/permissions/', permission, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const deletePermission = async (id, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/permissions/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const addUserToPermission = async (id, email, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(
			`/permissions/${id}`,
			{ email },
			{
				headers: { Authorization: `Bearer ${token}` }
			}
		);
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const removeUserFromPermission = async (id, memberID, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/permissions/${id}/member/${memberID}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const addJob = async (location, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post('/jobs', location, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const deleteJob = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.delete(`/jobs/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchJobs = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/jobs', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchLocations = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/locations', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const fetchLocation = async (id: string, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get(`/locations/${id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const updateLocation = async (id, name, city, ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.post(
			`/locations/${id}`,
			{ name, city },
			{
				headers: { Authorization: `Bearer ${token}` }
			}
		);
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const autocompleteMembers = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/autocomplete/members/', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};

export const autocompleteLocations = async (ctx?: IContext) => {
	try {
		const token = getToken(ctx);
		const {
			data: { response }
		} = await api.get('/autocomplete/locations/', {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response;
	} catch (error) {
		throw error.response.data;
	}
};
