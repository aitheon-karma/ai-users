/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    UserKYCDocument = mongoose.model('UserKYCDocument'),
    errorHandler = require('../../core/errors.controller'),
    policy = require('../../core/policy.controller'),
    logger = require('../../core/logger'),
    path = require('path'),
    aws = require('aws-sdk'),
    config = require(path.resolve('./config')),
    async = require('async'),
    uuidv1 = require('uuid/v1'),
    multer = require('multer'),
    fs = require('fs'),
    crypto = require('crypto'),
    zlib = require('zlib'),
    multerS3 = require('multer-s3-transform'),
    request = require('request');

const algorithm = 'aes-256-ctr';

const bucketName = config.aws_s3.bucket;
const s3 = new aws.S3({
  params: { Bucket: bucketName },
  credentials: config.aws_s3.credentials
});
// const decrypt = crypto.createDecipher(algorithm, config.KYC.documentPassword);
// var unzip = zlib.createGunzip();
// const decryptFileStream = fs.createWriteStream(path.resolve('./api/users/kyc/decrypt.jpg'));
// s3.getObject({ Bucket: bucketName, Key: 'APP/USERS/5ac90bf06bea760017cd34b4/DOCUMENTS/3c4bec10-581b-11e8-b686-cb2cd1094116.jpg' })
//   .createReadStream().pipe(decrypt).pipe(decryptFileStream);

const uploadDocumentMulter = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    shouldTransform: true,
    transforms: [
      {
        id: 'main',
        key: (req, file, cb) => {
          if (req.kycDocument && req.kycDocument.fileStoreKey){
            return cb(null, req.kycDocument.fileStoreKey);
          }
          let filename = uuidv1() + file.originalname.substring(file.originalname.lastIndexOf('.'));
          let key = `APP/${ config.serviceId }/${ req.currentUser._id }/DOCUMENTS/${ filename }`;
          cb(null, key);
        },
        transform: (req, file, cb) => {
          // documentPassword
          // req.file 
          var encrypt = crypto.createCipher(algorithm, config.KYC.documentPassword);
          var zip = zlib.createGzip();
          // pipe(zip).pipe(encrypt).on()
          
          cb(null, zip.pipe(encrypt));
        },
      }
    ]
  }),
  limits: { 
    fileSize: 10 * 1048576
  },
  fileFilter: function (req, file, cb) {
    var filetypes = /jpeg|jpg|png|gif/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("File upload only supports the following filetypes - JPG | PNG | GIF");
  }
}).single('file');


exports.uploadDocument = (req, res) => {
  UserKYCDocument.findOne({ user: req.currentUser._id, docType: req.query.docType }).exec((err, kycDocument) => {
    req.kycDocument = kycDocument;
    if (req.kycDocument && req.kycDocument.status === "UPLOADED"){
      return res.status(422).send({
        message: 'Document already in processing and can not be uploaded again.'
      });
    }
    uploadDocumentMulter(req, res, (err) => {
      if (err) {
        if (err && err.code === "LIMIT_FILE_SIZE"){
          return res.status(422).send({
            message: 'Image file too large. Maximum size allowed is ' + 10 + ' Mb files.'
          });
        }
        // Image file too large. Maximum size allowed is ' + 2 + ' Mb files.
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err) || err
        });
      }
      let file = req.file.transforms[0];
      let kycDocument = {
        docType: req.body.docType,
        fileStoreKey: file.key,
        contentType: req.file.mimetype,
        size: file.size,
        status: 'UPLOADED',
        verificationCode: req.body.verificationCode
      };

      UserKYCDocument
          .updateOne({ user: req.currentUser._id, docType: kycDocument.docType }, kycDocument, { upsert: true, new: true })
          .exec((err, kycDocument) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        setUserKYC(req.currentUser);

        return res.sendStatus(201);
      });
    });
  });
}

const setUserKYC = async (user) => {
  try {
    const documents = await UserKYCDocument.find({ user: user._id });
    const docsLengthMustBe = 2;
    const uploaded = documents.filter((d) => { return d.status === 'UPLOADED' });
    if (uploaded.length === docsLengthMustBe){
      const PHOTO_ID = documents.find((d)=> { return d.docType === 'PHOTO_ID' });
      if (PHOTO_ID.photoIDNumber){
        await User.updateOne({ _id: user._id }, { $set: { 'KYCStatus': 'PENDING' } });
      }
    }
  } catch (err) {
    logger.error('setUserKYC:' + JSON.stringify(err));
  }
}

exports.savePhotoIDNumber = (req, res) => {
  const photoIDNumber = req.body.photoIDNumber;
  UserKYCDocument
  .updateOne({ user: req.currentUser._id, docType: 'PHOTO_ID' }, { docType: 'PHOTO_ID', photoIDNumber: photoIDNumber }, { upsert: true, new: true })
  .exec((err, kycDocument) => {
  if (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err)
    });
  }
  setUserKYC(req.currentUser);

  return res.sendStatus(201);
  });
}

exports.listDocuments = (req, res) => {
  UserKYCDocument.find({ user: req.currentUser._id },' _id status docType photoIDNumber').exec((err, documents) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    documents = documents.map((d) => {
      if (d.photoIDNumber){
        d.photoIDNumber = true;
      }
      return d;
    })

    return res.json(documents);
  })
}