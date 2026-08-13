import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import ShareButton from '../components/menu-bar/share-button.jsx';
import GCShareModal from '../components/menu-bar/gc-share-modal.jsx';
import dataURItoBlob from '../lib/data-uri-to-blob.js';
import log from '../lib/log';
import {shareProject} from '../lib/glitchcat/api';
import {showAlertWithTimeout, showStandardAlert} from '../reducers/alerts';
import {getIsShowingProject} from '../reducers/project-state';

// TODO: fix this jsdoc comment
/**
 * IT'S JUST THE SHAREBUTTON WITH EXTRA THINGS
 */
class GCShareButton extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleCancel',
            'handleConfirm',
            'handleChangeTitle',
            'handleChangeThumbnail'
        ]);
        this.state = {
            sharing: false,
            shareId: null,
            shareUrl: null,
            modalOpen: false,
            title: props.projectTitle,
            thumbnailFile: null,
            thumbnailPreview: null
        };
    }

    /**
     * Captures a snapshot of the current stage to use as the default
     * thumbnail, matching the approach used for backpack/save thumbnails.
     * @param {function(?string)} callback - called with a data URI, or null on failure.
     */
    captureDefaultThumbnail (callback) {
        try {
            this.props.vm.postIOData('video', {forceTransparentPreview: true});
            this.props.vm.renderer.requestSnapshot(dataURI => {
                this.props.vm.postIOData('video', {forceTransparentPreview: false});
                callback(dataURI);
            });
            this.props.vm.renderer.draw();
        } catch (e) {
            log.error('Could not capture project thumbnail', e);
            callback(null);
        }
    }

    handleClick () {
        if (this.state.sharing || !this.props.canSaveProject) {
            return;
        }

        this.captureDefaultThumbnail(dataURI => {
            this.setState({
                modalOpen: true,
                title: this.props.projectTitle,
                thumbnailFile: null,
                thumbnailPreview: dataURI
            });
        });
    }

    handleCancel () {
        if (this.state.sharing) return;
        this.setState({
            modalOpen: false,
            thumbnailFile: null,
            thumbnailPreview: null
        });
    }

    handleChangeTitle (e) {
        this.setState({title: e.target.value});
    }

    handleChangeThumbnail (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            this.setState({
                thumbnailFile: file,
                thumbnailPreview: reader.result
            });
        };
        reader.readAsDataURL(file);
    }

    async handleConfirm () {
        const title = this.state.title.trim();
        if (this.state.sharing || !title) {
            return;
        }

        this.setState({sharing: true});
        this.props.onShowSharingAlert();

        try {
            const projectSb3 = await this.props.vm.saveProjectSb3();
            const thumbnail = this.state.thumbnailFile ||
                (this.state.thumbnailPreview ? dataURItoBlob(this.state.thumbnailPreview) : null);

            const result = await shareProject(projectSb3, {
                title,
                projectId: this.state.shareId,
                thumbnail
            });

            this.setState({
                sharing: false,
                modalOpen: false,
                shareId: result.id,
                shareUrl: result.url,
                thumbnailFile: null,
                thumbnailPreview: null
            });

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(result.url).catch(() => {});
            }

            this.props.onShowShareSuccessAlert();
            window.open(result.url, '_blank', 'noopener');
        } catch (err) {
            log.error(err);
            this.setState({sharing: false});
            this.props.onShowShareErrorAlert();
        }
    }

    render () {
        const {
            /* eslint-disable no-unused-vars */
            vm,
            projectTitle,
            canSaveProject,
            onShowSharingAlert,
            onShowShareSuccessAlert,
            onShowShareErrorAlert,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <React.Fragment>
                <ShareButton
                    {...props}
                    isShared={Boolean(this.state.shareId)}
                    onClick={this.handleClick}
                />
                {this.state.modalOpen && (
                    <GCShareModal
                        sharing={this.state.sharing}
                        thumbnailPreview={this.state.thumbnailPreview}
                        title={this.state.title}
                        onCancel={this.handleCancel}
                        onChangeThumbnail={this.handleChangeThumbnail}
                        onChangeTitle={this.handleChangeTitle}
                        onConfirm={this.handleConfirm}
                    />
                )}
            </React.Fragment>
        );
    }
}

GCShareButton.propTypes = {
    canSaveProject: PropTypes.bool,
    className: PropTypes.string,
    onShowShareErrorAlert: PropTypes.func,
    onShowShareSuccessAlert: PropTypes.func,
    onShowSharingAlert: PropTypes.func,
    projectTitle: PropTypes.string,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    projectTitle: state.scratchGui.projectTitle,
    canSaveProject: getIsShowingProject(state.scratchGui.projectState.loadingState)
});

const mapDispatchToProps = dispatch => ({
    onShowSharingAlert: () => showAlertWithTimeout(dispatch, 'gcSharing'),
    onShowShareSuccessAlert: () => showAlertWithTimeout(dispatch, 'gcShareSuccess'),
    onShowShareErrorAlert: () => dispatch(showAlertWithTimeout(dispatch, 'gcShareError'))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GCShareButton);
