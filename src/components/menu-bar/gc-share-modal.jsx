import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';

import styles from './gc-share-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Share Project',
        description: 'Title of the share project modal',
        id: 'gc.shareModal.title'
    },
    titleLabel: {
        defaultMessage: 'Title',
        description: 'Label for the project title field in the share modal',
        id: 'gc.shareModal.titleLabel'
    },
    thumbnailLabel: {
        defaultMessage: 'Thumbnail',
        description: 'Label for the project thumbnail field in the share modal',
        id: 'gc.shareModal.thumbnailLabel'
    },
    chooseImage: {
        defaultMessage: 'Choose Image…',
        description: 'Button to pick a custom thumbnail image in the share modal',
        id: 'gc.shareModal.chooseImage'
    }
});

const GCShareModal = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.intl.formatMessage(messages.title)}
        id="gcShareModal"
        onRequestClose={props.onCancel}
    >
        <Box className={styles.body}>
            <Box className={styles.field}>
                <label
                    className={styles.label}
                    htmlFor="gcShareModalTitle"
                >
                    <FormattedMessage {...messages.titleLabel} />
                </label>
                <input
                    autoFocus
                    className={styles.titleInput}
                    id="gcShareModalTitle"
                    type="text"
                    value={props.title}
                    onChange={props.onChangeTitle}
                />
            </Box>
            <Box className={styles.field}>
                <span className={styles.label}>
                    <FormattedMessage {...messages.thumbnailLabel} />
                </span>
                <Box className={styles.thumbnailRow}>
                    {props.thumbnailPreview ? (
                        <img
                            alt=""
                            className={styles.thumbnailPreview}
                            src={props.thumbnailPreview}
                        />
                    ) : (
                        <div className={styles.thumbnailPlaceholder} />
                    )}
                    <label className={styles.chooseImageButton}>
                        <FormattedMessage {...messages.chooseImage} />
                        <input
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className={styles.fileInput}
                            type="file"
                            onChange={props.onChangeThumbnail}
                        />
                    </label>
                </Box>
            </Box>
            <Box className={styles.buttonRow}>
                <button
                    className={styles.cancelButton}
                    disabled={props.sharing}
                    onClick={props.onCancel}
                >
                    <FormattedMessage
                        defaultMessage="Cancel"
                        description="Button in share modal for cancelling the dialog"
                        id="gc.shareModal.cancel"
                    />
                </button>
                <button
                    className={styles.okButton}
                    disabled={props.sharing || !props.title.trim()}
                    onClick={props.onConfirm}
                >
                    {props.sharing ? (
                        <FormattedMessage
                            defaultMessage="Sharing…"
                            description="Button in share modal while the project is uploading"
                            id="gc.shareModal.sharing"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Share"
                            description="Button in share modal for confirming the share"
                            id="gc.shareModal.confirm"
                        />
                    )}
                </button>
            </Box>
        </Box>
    </Modal>
);

GCShareModal.propTypes = {
    intl: intlShape.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChangeThumbnail: PropTypes.func.isRequired,
    onChangeTitle: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    sharing: PropTypes.bool.isRequired,
    thumbnailPreview: PropTypes.string,
    title: PropTypes.string.isRequired
};

export default injectIntl(GCShareModal);
