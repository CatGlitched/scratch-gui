const {API_URL: GC_SERVER} = require('../constants');
const {GCApiError} = require('./api');

/**
 * Shared fetch wrapper for the auth endpoints. Always sends the session
 * cookie (credentials: 'include').
 * @param {string} path - path relative to GC_SERVER, e.g. '/auth/login'.
 * @param {object} [options] - fetch options (method, body, etc).
 * @returns {Promise<object|null>} parsed JSON body, or null for 204 responses.
 */
const authFetch = async (path, options = {}) => {
    let res;
    try {
        res = await fetch(`${GC_SERVER}${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });
    } catch (err) {
        throw new GCApiError('Could not reach the GlitchCat server', {source: 'glitchcat'});
    }

    if (res.status === 204) {
        return null;
    }

    let data = null;
    try {
        data = await res.json();
    } catch (err) {
        // no body / non-JSON body; fall through to status check below
    }

    if (!res.ok) {
        throw new GCApiError(
            (data && data.error) || `Unexpected status code: ${res.status}`,
            {status: res.status, source: 'glitchcat'}
        );
    }

    return data;
};

/**
 * @returns {Promise<{id: string, username: string}|null>} the current user, or
 * null if nobody is logged in.
 */
const getCurrentUser = async () => {
    try {
        return await authFetch('/auth/me');
    } catch (err) {
        if (err instanceof GCApiError && err.status === 401) {
            return null;
        }
        throw err;
    }
};

const logout = () => authFetch('/auth/logout', {method: 'POST'});

export {
    getCurrentUser,
    logout
};