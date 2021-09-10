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
    const widgets = [
        {
            user: '',
            component: 'feed',
            position: {
            height: 50,
            width: 20,
            left: 1,
            top: 1
            },
            resizeable: false
        },
        {
            user: '',
            component: 'treasuryAccounts',
            position: {
            height: 8,
            width: 20,
            left: 41,
            top: 26
            },
            resizeable: false
        },
        {
            user: '',
            component: 'profileState',
            position: {
            height: 25,
            width: 20,
            left: 41,
            top: 1
            },
            resizeable: false
        }
    ]
    User.find({}, (err, users) => {
        if (err){
          console.log('Error: ', err);
          return;
        }
        console.log("Users: " + users.length);
        var userCount = 0;
        async.each(users, (user, userDone) => {
            var widgetsCopy = JSON.parse(JSON.stringify(widgets));
            widgetsCopy.forEach(widget => {
                widget.user = user
            })

            Widget.insertMany(widgetsCopy, function(err, res) {
                if (err){
                    console.log('Insert Error: ', err);
                    return;
                }
                userCount = userCount + 1;
                console.log("Users updated: " + userCount + " " + user._id);
            }, userDone);
            /*async.each(widgets, (item, widgetAdded)=> {
                const widget = new Widget(item);
                item.user = user;
                Widget.update({ _id: item._id }, item, { upsert: true, setDefaultsOnInsert: true}, widgetAdded);
            }, userDone);*/
          }, done);
    });
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