import {LoadProjectError} from './tw-load-project-error.js';

class ProjectNotFoundError extends LoadProjectError {
    constructor (message) {
        super(message);
        this.name = 'ProjectNotFoundError';
    }
}

module.exports = {
    ProjectNotFoundError
};