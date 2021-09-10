/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserKYCDocumentSchema = new Schema({
    docType: {
        type: String,
        enum: ['PHOTO_ID', 'PHOTO_HOLDING_ID']
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    fileStoreKey: String,
    contentType: String,
    size: Number,
    status: {
        type: String,
        enum: ['UPLOADED', 'PROCESSING', 'VERIFIED', 'REJECTED']
    },
    photoIDNumber: String,
    verificationCode: String
}, {
    timestamps: true,
    collection: 'users__kyc_documents',
});

module.exports = mongoose.model('UserKYCDocument', UserKYCDocumentSchema);
