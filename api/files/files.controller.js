/*
 * Module dependencies.
 */
const _ = require('lodash'),
      express = require('express'),
      mongoose = require('mongoose'),
      Organization = mongoose.model('Organization'),
      Service = mongoose.model('Service'),
      File = mongoose.model('File'),
      aws = require('aws-sdk'),
      multer = require('multer'),
      multerS3 = require('multer-s3'),
      uuidV4 = require('uuid/v4'),
      errorHandler = require('../core/errors.controller');

const bucketName = config.aws_s3.bucket;
const s3 = new aws.S3({
  params: { Bucket: bucketName },
  credentials: config.aws_s3.credentials
});

const uploadMulter = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      let filename = uuidV4() + file.originalname.substring(file.originalname.lastIndexOf('.'));
      let key = `${ req.organization.domain }/${ config.serviceId }/org-files/${ filename }`;
      cb(null, key);
    }
  })
}).single('file');

/*
 * file list by organization
 */
exports.list = (req, res) => {
  File.find({ organization: req.organization }).exec((err, files) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(files);
    }
  });
};

/**
 * file middleware
 */
exports.fileByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'File is invalid'
    });
  }

  File.findById(id).exec((err, file) => {
      if (err) {
        return next(err);
      } else if (!file) {
        return res.status(404).send({
          message: 'No file with that identifier has been found'
        });
      }
      req.file = file;
      next();
    });
};

/*
 * Create file
 */
exports.create = (req, res) => {
  uploadMulter(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    const file = req.file;
    const dbFile = new File(_.pick(req.body, 'name'));

    dbFile.organization = req.organization._id.toString();
    dbFile.fileStoreKey = file.key;
    dbFile.contentType = file.mimetype;
    dbFile.size = file.size;

    dbFile.save((err, file) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.jsonp(dbFile);
      }
    });
  });
}

/*
 * Delete file
*/
exports.delete = (req, res) => {
  let file = req.file;
  s3.deleteObject({ Key: file.fileStoreKey }, (err, data) => {
    if (err){
      res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    file.remove((err) => {
      if (err){
        res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(file);
    });
  });
};
 
/**
 * File streaming
 */
exports.fileStream = (req, res) => {
  const file = req.file;
  /**
   * Stream by bytes
   */
  if (req.headers.range) {
    var range = req.headers.range;
    var bytes = range.replace(/bytes=/, '').split('-');
    var start = parseInt(bytes[0], 10);

    var total = file.fileSize;
    var end = bytes[1] ? parseInt(bytes[1], 10) : total - 1;
    var chunksize = (end - start) + 1;

    // console.log('Stream range. ', range);

    res.writeHead(206, {
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Last-Modified': file.updatedAt || file.createAt,
      'Content-Type': file.fileContentType
    });

    s3.getObject({ Key: file.fileStoreKey, Range: range }).createReadStream().pipe(res);
  } else {
    // console.log('Stream whole file. ', content.name);
    const headers = {
      'Content-Length': file.size,
      'Last-Modified': file.updatedAt || file.createAt,
      'Content-Type': file.contentType
    };
    if (req.query['download']) {
      headers['Content-Disposition'] = `attachment; filename=${ file.name }${ file.name.substr(file.name.lastIndexOf('.')) }`;
    }
    res.writeHead(200, headers);
    const params = {
      Key: file.fileStoreKey
    }
    s3.getObject(params).createReadStream().pipe(res);
  }
};
