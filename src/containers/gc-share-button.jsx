import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import ShareButton from '../components/menu-bar/share-button.jsx';
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
            'handleClick'
        ]);
        this.state = {
            sharing: false,
            shareId: null,
            shareUrl: null
        };
    }
    async handleClick () {
        if (this.state.sharing || !this.props.canSaveProject) {
            return;
        }

        this.setState({sharing: true});
        this.props.onShowSharingAlert();

        try {
            const projectSb3 = await this.props.vm.saveProjectSb3();
            const result = await shareProject(projectSb3, {
                title: this.props.projectTitle,
                projectId: this.state.shareId
            });

            this.setState({
                sharing: false,
                shareId: result.id,
                shareUrl: result.url
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
            <ShareButton
                {...props}
                isShared={Boolean(this.state.shareId)}
                onClick={this.handleClick}
            />
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