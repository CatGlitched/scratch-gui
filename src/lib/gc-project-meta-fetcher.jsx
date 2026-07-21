import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import log from './log';

import {setProjectTitle} from '../reducers/project-title';
import {setAuthor, setDescription, setProjectMeta} from '../reducers/tw';
import {fetchProjectMeta, GC_SERVER} from './glitchcat/api';

export {fetchProjectMeta};

const getNoIndexTag = () => document.querySelector('meta[name="robots"][content="noindex"]');
const setIndexable = indexable => {
    if (indexable) {
        const tag = getNoIndexTag();
        if (tag) {
            tag.remove();
        }
    } else if (!getNoIndexTag()) {
        const tag = document.createElement('meta');
        tag.name = 'robots';
        tag.content = 'noindex';
        document.head.appendChild(tag);
    }
};

/**
 * Fetches project metadata from the GlitchCat server and populates the Redux store with it.
 *
 * @param {React.Component} WrappedComponent - component to wrap.
 * @returns {React.Component} component with project metadata fetching behavior.
 */
const GCProjectMetaFetcherHOC = function (WrappedComponent) {
    class ProjectMetaFetcherComponent extends React.Component {
        componentDidUpdate (prevProps) {
            if (this.props.reduxProjectId !== prevProps.reduxProjectId) {
                this.props.onSetAuthor('', '');
                this.props.onSetDescription('', '');
                this.props.onSetProjectMeta(null);
                const projectId = this.props.reduxProjectId;

                if (projectId === '0') {
                    // don't try to get metadata for the default/blank project
                    return;
                }

                fetchProjectMeta(projectId).then(data => {
                    // If project ID changed while this was in flight, ignore the results.
                    if (this.props.reduxProjectId !== projectId) {
                        return;
                    }

                    this.props.onSetProjectMeta(data);

                    const title = data.title;
                    if (title) {
                        this.props.onSetProjectTitle(title);
                    }

                    if (data.author) {
                        const authorName = data.author.username;
                        const authorThumbnail = data.author.thumbnail;
                        this.props.onSetAuthor(authorName, authorThumbnail);
                    }

                    const instructions = data.instructions || '';
                    const credits = data.description || '';
                    if (instructions || credits) {
                        this.props.onSetDescription(instructions, credits);
                    }

                    setIndexable(true);
                })
                    .catch(err => {
                        setIndexable(false);
                        if (err && err.status === 404) {
                            this.props.onSetDescription('unshared', 'unshared');
                        }
                        log.warn('cannot fetch project meta', err);
                    });
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                reduxProjectId,
                onSetAuthor,
                onSetDescription,
                onSetProjectTitle,
                onSetProjectMeta,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    {...props}
                />
            );
        }
    }
    ProjectMetaFetcherComponent.propTypes = {
        reduxProjectId: PropTypes.string,
        onSetAuthor: PropTypes.func,
        onSetDescription: PropTypes.func,
        onSetProjectMeta: PropTypes.func,
        onSetProjectTitle: PropTypes.func
    };
    const mapStateToProps = state => ({
        reduxProjectId: state.scratchGui.projectState.projectId
    });
    const mapDispatchToProps = dispatch => ({
        onSetAuthor: (username, thumbnail) => dispatch(setAuthor({
            username,
            thumbnail
        })),
        onSetDescription: (instructions, credits) => dispatch(setDescription({
            instructions,
            credits
        })),
        onSetProjectMeta: meta => dispatch(setProjectMeta(meta)),
        onSetProjectTitle: title => dispatch(setProjectTitle(title))
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(ProjectMetaFetcherComponent);
};

export {
    GCProjectMetaFetcherHOC as default,
    GC_SERVER
};