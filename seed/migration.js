/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;
      glob = require('glob'),
      path = require('path'),
      async = require('async'),
      shortid = require('shortid'),
      aws = require('aws-sdk'),
      fs = require('fs'),
      config = require(path.resolve('./config'));


const bucketName = config.aws_s3.bucket;
const s3 = new aws.S3({
  params: { Bucket: bucketName },
  credentials: config.aws_s3.credentials
});
const environment = config.environment;

// Use native promises
mongoose.Promise = global.Promise;

// Load models
const models = glob.sync('./api/**/*.model.js');
models.forEach((model) => {
  require(path.resolve(model));
});

const User = mongoose.model('User');
const UserWallet = mongoose.model('UserWallet');

/**
 * Initial Seed DB
 * @param {*} done 
 */
const migration = (done) => {
  
  const stream = User.find({ devicesPin: { $exists: false }  }).cursor({ batchSize: 1 });
  // stream.next((err, user) => {
  //   console.log(err, user);
  // })
  // stream.next().then(function (data) {
  //   console.log(data)
  // }).catch((err) => {
  //   console.log(err);
  // })
  stream.on('error', (err) => {
    console.log(err);
  })
  stream.on('data',  (user) => {;
    // async.each(users, (user, userDone) => {
     
    // }, (err) => {
    //   // done();
    //   if (err) {
    //     console.log(err);
    //   }
    //   console.log('Done');
    //   done();
    // })
    user.devicesPin = Math.floor(100000 + Math.random() * 900000);
    User.findOne({ devicesPin: user.devicesPin }, (err, exist) => {
      if (err){
        console.log(err);
      }
      if (exist){
        user.devicesPin = Math.floor(100000 + Math.random() * 900000);
      }
      user.save((err) => {
        if (err){
          console.log(err);
        }
        console.log('User saved');
      });
    })
  
  })
  // .on('end', () => { done(); });
}



function listen () {
  async.waterfall([migration], (err) => {
    if (err){
      console.log('Error: ', err);
    }
    console.log(`
        ------------
        Seed DB Done!
      ------------
    `);
    process.exit(0);
  })
   
}

const connect = () => {
  var options = config.db.options || {
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    bufferMaxEntries: 0,
    useNewUrlParser: true
  };
  var dbUri = config.db.uri;

  return mongoose.connect(dbUri, options, function(error) {
    if (error){
      return logger.error('[DB Connect]', error);
    }
    listen();
    // Check error in initial connection. There is no 2nd param to the callback.
  });
}


connect()


// db.users.aggregate(

// 	// Pipeline
// 	[
// 		// Stage 1
// 		{
// 			$group: { "_id": "$devicesPin", "count": { "$sum": 1 } }
// 		},

// 		// Stage 2
// 		{
// 			$match: {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} }
// 		},

// 		// Stage 3
// 		{
// 			$project: {"devicesPin" : "$_id", "_id" : 0}
// 		},
// 	],

// 	// Options
// 	{
// 		cursor: {
// 			batchSize: 50
// 		}
// 	}

// 	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

// );
