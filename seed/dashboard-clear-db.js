/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;
      glob = require('glob'),
      path = require('path'),
      async = require('async'),
      generatePassword = require('generate-password')
      config = require(path.resolve('./config'));


const environment = config.environment;

// Use native promises
mongoose.Promise = global.Promise;

// Load models
const models = glob.sync('./api/**/*.model.js');
models.forEach((model) => {
  require(path.resolve(model));
});

const User = mongoose.model('User');
const Widget = mongoose.model('Widget');

/**
 * Initial Seed DB
 * @param {*} done 
 */
const seedDb = (done) => {
    const list = [
        // todo add widgets here
    ]
    Widget.find({}, (err, widgets) => {
        if (err){
          console.log('Find Error: ', err);
          return;
        }
        console.log("widgets: " + widgets.length);
        Widget.deleteMany({}, function(err, obj) {
          if (err) {
            console.log('Delete Error: ', err);
            return;
          }
          console.log("document(s) deleted");
        });
    });
}

function AddWidgets(userId){
    console.log("Id: " + userId);
    async.each(widgets, (widget, widgetAdded)=> {

    }, userDone)
}






/**
 * Connect to Database and only then run
 */

const db = connect();
  //.on('error', console.log)
  // .on('disconnected', connect)
  //.once('open', listen);


function listen () {
  async.waterfall([seedDb], (err) => {
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

function connect () {
  var options = config.db.options || {};
  var dbUri = config.db.uri;
    console.log("connecting>>>" +dbUri + " " + JSON.stringify(options));
  
     
    

    mongoose.connect(dbUri, options, (err) => {
        console.log("error: " + err);
        listen();
        return 0;
    })
}