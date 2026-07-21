const {API_URL: GC_SERVER, SITE_URL: GC_SITE_URL} = require("../constants");

class GCApiError extends Error {
    constructor (message, {status, source} = {}) {
        super(message);
        this.name = 'GCApiError';
        this.status = status;
        this.source = source;
    }
}

/**
 * Fetch project metadata (title, author, description, and any GlitchCat-specific
 * fields such as likes/remixes/tags) for a given project id.
 * @param {string} projectId - the project id to fetch metadata for.
 * @returns {Promise<object>} the raw metadata object as returned by whichever source answered.
 */
const fetchProjectMeta = async projectId => {
    const cacheBuster = `cachebust=${Math.random()}`;

    const sources = [
        {
            url: `${GC_SERVER}/projects/${projectId}?${cacheBuster}`,
            name: 'glitchcat'
        }
    ];

    let firstError;
    for (const source of sources) {
        try {
            const res = await fetch(source.url);
            if (res.status === 404) {
                if (!firstError) {
                    firstError = new GCApiError('Project not found', {status: 404, source: source.name});
                }
                continue;
            }
            if (!res.ok) {
                throw new GCApiError(`Unexpected status code: ${res.status}`, {
                    status: res.status,
                    source: source.name
                });
            }
            const data = await res.json();

            data._gcSource = source.name;
            return data;
        } catch (err) {
            if (!firstError) {
                firstError = err;
            }
        }
    }

    throw firstError || new GCApiError('Could not fetch project metadata');
};

// TODO: make it redirect to upload page on web repo
/**
 * Upload a project's packaged .sb3 data to the GlitchCat server.
 * @param {Blob} projectSb3 - the packaged project, e.g. from vm.saveProjectSb3().
 * @param {object} [meta] - optional metadata to send along with the upload.
 * @param {string} [meta.title] - the project's title.
 * @param {string} [meta.projectId] - an existing GlitchCat project id to update
 * instead of creating a brand new project.
 * @returns {Promise<{id: string, url: string}>} the id of the created/updated
 * project and a shareable URL pointing at it.
 */
const shareProject = async (projectSb3, meta = {}) => {
    const {title, projectId} = meta;

    const formData = new FormData();
    formData.append('project', projectSb3, 'project.sb3');
    if (title) {
        formData.append('title', title);
    }

    const isUpdate = Boolean(projectId);
    const url = isUpdate ? `${GC_SERVER}/projects/${projectId}` : `${GC_SERVER}/projects`;

    let res;
    try {
        res = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            credentials: 'include',
            body: formData
        });
    } catch (err) {
        throw new GCApiError('Could not reach the GlitchCat server', {source: 'glitchcat'});
    }

    if (!res.ok) {
        throw new GCApiError(`Unexpected status code: ${res.status}`, {
            status: res.status,
            source: 'glitchcat'
        });
    }

    let data;
    try {
        data = await res.json();
    } catch (err) {
        throw new GCApiError('Could not parse server response', {source: 'glitchcat'});
    }

    if (!data || !data.id) {
        throw new GCApiError('Server response did not include a project id', {source: 'glitchcat'});
    }

    return {
        id: data.id.toString(),
        url: `${GC_SITE_URL}/${data.id}`
    };
};

export {
    fetchProjectMeta,
    shareProject,
    GCApiError,
    GC_SERVER,
    GC_SITE_URL
};