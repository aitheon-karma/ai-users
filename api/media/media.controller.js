/*
 * Module dependencies.
 */
const _ = require('lodash'),
  express = require('express'),
  mongoose = require('mongoose'),
  Media = mongoose.model('Media'),
  aws = require('aws-sdk'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  config = require('../../config'),
  logger = require('../core/logger'),
  uuidv1 = require('uuid/v1'),
  parseRange = require('range-parser'),
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
      let filename = uuidv1().toString();
      let key = `APP/Media/${filename}`;
      cb(null, key);
    }
  })
}).single('file');

/*
 * Get
 */
exports.getStream = (req, res) => {
  Media.findById(req.params.mediaId).lean().exec((err, media) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (!media) {
      return res.sendStatus(404);
    }

    /**
    * Stream by bytes
    */
     // indicate this resource can be partially requested
    res.set('Accept-Ranges', 'bytes');
    // incorporate media
    if (media.size){
      res.set('Content-Length', media.size);
    }
    if (media.contentType){
      res.set('Content-Type', media.contentType);
    }
    // if this is a partial request
    if (req.headers.range) {
      // parse ranges
      var ranges = parseRange(media.size, req.headers.range);
      if (ranges === -2){
        return res.sendStatus(400);
      }; // malformed range
      if (ranges === -1) {
        // unsatisfiable range
        res.set('Content-Range', '*/' + media.length);
        return res.sendStatus(416);
      }
      if (ranges.type !== 'bytes'){
        return sendFullFile(media, req, res);
      }
      if (ranges.length > 1) {
        logger.error('Can only serve single ranges.', media._id);
        return res.status(422).send({
          message: 'Can only serve single ranges'
        });
      }
      var start = ranges[0].start;
      var end = ranges[0].end;
      // formatting response
      res.status(206);
      res.set('Content-Length', (end - start) + 1); // end is inclusive
      res.set('Content-Range', 'bytes ' + start + '-' + end + '/' + media.size);
      // slicing the stream to partial media
      s3.getObject({ Key: media.storeKey, Range: `bytes=${start}-${end}` }).createReadStream()
      .on('error', function (err) { //Handles errors on the read stream
          logger.error('Error reading slicing stream', err);
      }).pipe(res);
    } else {
      sendFullFile(media, req, res);
    }
  });
};

sendFullFile = (media, req, res) => {
  const headers = {
    'Content-Length': media.size,
    'Last-Modified': media.updatedAt || media.createAt,
    'Content-Type': media.contentType
  };
  if (req.query['download']) {
    headers['Content-Disposition'] = `attachment; filename=${ media.name }.${ media.extension }`;
  }
  res.writeHead(200, headers);
  const params = {
    Key: media.storeKey
  }
  s3.getObject(params).createReadStream().on('error', function (err) { //Handles errors on the read stream
    logger.error('Error reading full file', err);
    return res.status(500).send({
      message: errorHandler.getErrorMessage(err)
    });
  }).pipe(res);
}