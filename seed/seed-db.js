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

const Service = mongoose.model('Service');
const User = mongoose.model('User');

const servicesOnly = !!process.env.SERVICES_ONLY;

/**
 * Initial Seed DB
 * @param {*} done 
 */
const seedDb = (done) => {
  const list = [
    
    {
      _id: 'AUTH',
      name: 'Auth service',
      description: 'Auth microservice',
      url: '/auth',
      iconClass: 'fa fa-user',
      envStatus: 'PROD',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-auth.git',
      k8sNamespace: 'ai-auth',
      core: true,
      showAtMenu: false
    },
    
    {
      _id: 'USERS',
      name: 'Users service',
      description: 'Users microservice',
      url: '/users',
      iconClass: 'fa fa-users',
      envStatus: 'PROD',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-users.git',
      k8sNamespace: 'ai-users',
      core: true,
      showAtMenu: false
    },

    {
      _id: 'LANDING',
      name: 'Landing service',
      description: 'Landing microservice',
      url: '/',
      iconClass: 'fa fa-file',
      envStatus: 'PROD',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-landing.git',
      k8sNamespace: 'ai-landing',
      core: true,
      showAtMenu: false
    },

    {
      _id: 'ADMIN',
      name: 'Admin service',
      description: 'Admin microservice',
      url: '/admin',
      iconClass: 'fa fa-lock',
      envStatus: 'PROD',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-admin.git',
      k8sNamespace: 'ai-admin',
      core: true,
      showAtMenu: false
    },

    {
      _id: 'MAIL',
      name: 'Mail service',
      description: 'Mail microservice',
      url: '/mail',
      iconClass: 'fa fa-envelope',
      envStatus: 'PROD',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-mail.git',
      k8sNamespace: 'ai-mail',
      core: true,
      showAtMenu: false
    },

    {
      _id: 'MESSAGES',
      name: 'Messages',
      url: '/messages',
      description: 'Messages',
      serviceType: 'any',
      envStatus: 'ALPHA',
      iconClass: 'fa fa-comments',
      dependencies: [],
      gitUrl : 'git@github.com:Aitheon/ai-messages.git', 
      k8sNamespace : 'ai-messages',
      core: true,
      showAtMenu: true
    },
    {
      _id: 'DRIVE',
      name: 'Drive',
      url: '/drive',
      description: 'Aitheon Drive. Store all files across all services',
      serviceType: 'any',
      iconClass: 'fa fa-hdd-o',
      envStatus: 'ALPHA',
      dependencies: [],
      gitUrl : 'git@github.com:Aitheon/ai-drive.git', 
      k8sNamespace : 'ai-drive',
      core: true,
      showAtMenu: true
    },

    {
      _id: 'STATUS',
      name: 'Status',
      description: 'Status microservice',
      url: '/status',
      iconClass: 'fa fa-file',
      envStatus: 'ALPHA',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-status.git',
      k8sNamespace: 'ai-status',
      core: true,
      showAtMenu: false
    },

    {
      _id: 'PROJECT_MANAGER',
      name: 'Project Manager Service',
      url: '/project-manager',
      description: 'Service to do project management',
      serviceType: 'organization',
      iconClass: 'fa fa-book',
      envStatus: 'ALPHA',
      gitUrl : 'git@github.com:Aitheon/ai-project-manager.git', 
      k8sNamespace : 'ai-project-manager',
      core: false,
      showAtMenu: true
    },
    {
      _id: 'ACCOUNTING',
      name: 'Accounting service',
      url: '/accounting',
      description: 'Service to do general accounting',
      serviceType: 'organization',
      iconClass: 'fa fa-database',
      envStatus: 'ALPHA',
      gitUrl : 'git@github.com:Aitheon/ai-accounting.git', 
      k8sNamespace : 'ai-accounting', 
      core: false,
      showAtMenu: true
    },
    {
      _id: 'SPECIALISTS',
      name: 'Specialists',
      url: '/specialists',
      description: 'Service to enter data for specialists',
      serviceType: 'organization',
      iconClass: 'fa fa-database',
      envStatus: 'ALPHA',
      dependencies: [
        'ITEM_MANAGER'
      ],
      gitUrl : 'git@github.com:Aitheon/ai-specialists.git', 
      k8sNamespace : 'ai-specialists',
      core: false,
      showAtMenu: true
    },
    {
      _id: 'ITEM_MANAGER',
      name: 'Item Manager',
      url: '/item-manager',
      description: 'Basic item manager with files management',
      serviceType: 'organization',
      iconClass: 'fa fa-list',
      envStatus: 'ALPHA',
      gitUrl : 'git@github.com:Aitheon/ai-item-manager.git', 
      k8sNamespace : 'ai-item-manager', 
      core: false,
      showAtMenu: true
    },
    
    {
      _id: 'DEVICE_MANAGER',
      name: 'Device Manager',
      url: '/device-manager',
      description: 'Hardware devices, machines and robots manager',
      serviceType: 'organization',
      iconClass: 'fa fa-microchip',
      envStatus: 'ALPHA',
      gitUrl : 'git@github.com:Aitheon/ai-device-manager.git', 
      k8sNamespace : 'ai-device-manager', 
      core: false,
      showAtMenu: true
    },
    
    {
      _id: 'CAMERA_VIEWER',
      name: 'Camera viewer',
      url: '/camera-viewer',
      description: 'Camera Viewer',
      serviceType: 'organization',
      iconClass: 'fa fa-video-camera',
      envStatus: 'ALPHA',
      dependencies: [
        'DEVICE_MANAGER'
      ],
      gitUrl : 'git@github.com:Aitheon/ai-camera-viewer.git', 
      k8sNamespace : 'ai-camera-viewer', 
      core: false,
      showAtMenu: true
    },
    
    {
      _id: 'HR',
      name: 'HR',
      url: '/hr',
      description: 'HR and payroll',
      serviceType: 'organization',
      iconClass: 'fa fa-address-book',
      envStatus: 'ALPHA',
      dependencies: [],
      gitUrl : 'git@github.com:Aitheon/ai-hr.git', 
      k8sNamespace : 'ai-hr', 
      core: false,
      showAtMenu: true
    },
 
    {
      _id: 'COMMUNITY',
      name: 'Community',
      url: '/community',
      description: 'Community. Ideas, Polls and discussions',
      serviceType: 'personal',
      iconClass: 'fa fa-bullhorn',
      envStatus: 'ALPHA',
      dependencies: [],
      gitUrl : 'git@github.com:Aitheon/ai-community.git', 
      k8sNamespace : 'ai-community',
      core: false,
      showAtMenu: true
    },
    {
      _id: 'WAREHOUSE_MANAGER',
      name: 'Warehouse Manager',
      url: '/warehouse-manager',
      description: 'Warehouse manager',
      serviceType: 'organization',
      iconClass: 'fa fa-car',
      envStatus: 'ALPHA',
      dependencies: [],
      gitUrl : 'git@github.com:Aitheon/ai-warehouse-manager.git', 
      k8sNamespace : 'ai-warehouse-manager',
      core: false,
      showAtMenu: true
    },
    {
      _id: 'CREATORS_STUDIO',
      description: 'Creators studio',
      iconClass: 'fa fa-hdd-o',
      name: 'Creators studio',
      url: '/creators-studio',
      envStatus: 'ALPHA',
      private: false,
      serviceType: 'organization',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-creators-studio.git',
      k8sNamespace : 'ai-creators-studio',
      core: false,
      showAtMenu: true
    },
    {
      _id: 'TASKS',
      name: 'Tasks',
      description: 'Tasks',
      url: '/tasks',
      iconClass: 'fa fa-file',
      envStatus: 'ALPHA',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-tasks.git',
      k8sNamespace: 'ai-tasks',
      core: true,
      showAtMenu: false
    },
    {
      _id: 'TEMPLATE',
      name: 'Template',
      description: 'Template microservice',
      url: '/template',
      iconClass: 'fa fa-file',
      envStatus: 'ALPHA',
      private: false,
      serviceType: 'any',
      dependencies: [
      ],
      gitUrl: 'git@github.com:Aitheon/ai-template.git',
      k8sNamespace: 'ai-template',
      core: true,
      showAtMenu: false
    }

  ];
  async.each(list, (item, itemDone) => {
    const service = new Service(item);
    // service.save(itemDone);
    Service.update({ _id: item._id }, item, { upsert: true, setDefaultsOnInsert: true}, itemDone);
  }, done);

  if (servicesOnly){
    return;
  }

  const password = generatePassword.generate({
    length: 25,
    numbers: true,
    symbols: false,
    uppercase: true,
    excludeSimilarCharacters: true
  });
  const email = `admin@${ config.domain }`;
  const admin = new User({
    email: email,
    password: password,
    profile: {
      firstName: 'Isabel',
      lastName: 'Admin'
    },
    sysadmin: true
  })
  User.findOne({ email: email }, (err, user) => {
    if (err){
      console.log('Error find: ', err);
      return;
    }
    if (!user){
      admin.save((err) => {
        if (err){
          console.log('Admin error:', err);
          return;
        }
        console.log(`
          Admin generated.
          Email: ${ email }
          Password: ${ password }.
          You need to set it as sysadmin directly from DB.
        `);
      });
    } else {
      user.password = password;
      user.save((err) => {
        if (err){
          console.log('Admin error:', err);
          return;
        }
        console.log(`
          Admin password Reset!!!.
          Email: ${ email }
          Password: ${ password }
        `);
      });
    }

    
  })

}



/**
 * Connect to Database and only then run
 */

const db = connect()
  .on('error', console.log)
  // .on('disconnected', connect)
  .once('open', listen);


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

  return mongoose.connect(dbUri, options).connection;
}
