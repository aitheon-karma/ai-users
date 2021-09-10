const mongoose = require('mongoose'),
      faker = require('faker'),
      moment = require('moment'),
      _ = require('lodash'),
      shortid = require('shortid'),
      logger = require('../api/core/logger'),
      config = require('../config'),
      aws = require('aws-sdk'),
      request = require('request'),
      path = require('path'),
      fs = require('fs'),
      async = require('async');

const bucketName = config.aws_s3.bucket;
const s3 = new aws.S3({
  params: { Bucket: bucketName },
  credentials: config.aws_s3.credentials
});

const seedCollections = [
  'dataentry__queues',
  'dataentry__templates',
  'users',
  'hr__employees',
  'hr__tracker',
  'hr__documents',
  'hr__documents_controls',
  'hr__upworkers',
  'item_manager__items',
  'item_manager__categories',
  'device_manager__systems',
  'device_manager__devices',
  'users__widgets'
];

exports.seedOrganization = (currentUser) => {
  return new Promise((resolve, reject) => {
    const organization = {
      name: faker.company.companyName(),
      domain: faker.internet.domainWord() + _.random(1, 20).toString(),
      address: {
        line1: faker.address.streetAddress(),
        line2: faker.address.secondaryAddress(),
        city: faker.address.city(),
        state: faker.address.state(),
        zip: faker.address.zipCode(),
        country: 'United States'
      },
      primaryPhone: faker.phone.phoneNumberFormat(),
      services: [
        'PROJECT_MANAGER',
        'ACCOUNTING',
        'QUEUE',
        'ITEM_MANAGER',
        // 'MAGAZINE_CMS_ADMIN',
        'DEVICE_MANAGER',
        'CAMERA_VIEWER',
        'HR',
        'PAYMENT_PROCESSOR'
      ],
      isSeedDummy: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mongoose.connection.collection('organizations').insertOne(organization, (err, data) => {
      organization._id = data.insertedId;
      logger.debug('[organizations] Insert ', err, data.result);
      mongoose.connection.collection('users')
      .updateOne({ _id: mongoose.Types.ObjectId(currentUser._id.toString())  }, { $push: { roles: { organization: organization._id, role: 'Owner' } } }, (err, data) => {
        logger.debug('[users] Update to owner ', err, data.result);
        resolve(organization);
      });
    })
  });
}

exports.seed = (org, token) => {
  return new Promise((resolve, reject) => {
    async.waterfall([
      (done) => {
        if (org){
          done(null, org);
        } else {
          // create new organization
          done(null, {});
        }
      },
      (organization, done) => {
        // enable all services
        let services = [
         'PROJECT_MANAGER',
         'ACCOUNTING',
         'QUEUE',
         'ITEM_MANAGER',
        //  'MAGAZINE_CMS_ADMIN',
         'DEVICE_MANAGER',
         'CAMERA_VIEWER',
         'HR',
         'PAYMENT_PROCESSOR'
        ];
        mongoose.connection.collection('organizations')
          .updateOne({ _id: mongoose.Types.ObjectId(organization._id) }, { $set: {
            services: services
          }}, (err, data) => {
          logger.debug('[organizations] services update ', err, data.result);
          done(err, organization);
        });
      },
      (organization, done) => {
        // async in prod
        async.parallel([
          (callback) => {
            projectManagerSeed(organization, callback)
          },
          (callback) => {
            accountingSeed(organization, callback)
          },
          (callback) => {
            queueSeed(organization, callback)
          },
          (callback) => {
            itemManagerSeed(organization, token, callback)
          },
          // (callback) => {
          //   magazineCmsAdminSeed(organization, callback)
          // },
          (callback) => {
            deviceManagerSeed(organization, token, callback)
          },
          (callback) => {
            cameraViewerSeed(organization, callback)
          },
          (callback) => {
            hrSeed(organization, callback)
          },
          (callback) => {
            paymentProcessorSeed(organization, callback)
          }
        ], (err) => {
          done();
        })
      },
      
    ], (err) => {
      if (err){
        return reject();
      }
      resolve();
    })
  });
}

/**
 * PROJECT_MANAGER Seed
 */
projectManagerSeed = (organization, done) => {
  done(null);
}

/**
 * ACCOUNTING Seed
 */
accountingSeed = (organization, done) => {
  done(null);
}

/**
 * QUEUE Seed
 */
queueSeed = (organization, done) => {
  const templates = []
  for(let i = 0; i < 5; i++){
    templates.push({
      "organization": organization._id,
      "title" : faker.random.word(), 
      "matchPattern" : '', 
      "properties" : [
          {
              "key" : faker.random.word(), 
              "value" : '', 
              "isRequired" : false, 
          }, 
          {
              "key" : faker.random.word(), 
              "value" : "", 
              "isRequired" : true, 
          }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  mongoose.connection.collection('dataentry__templates').insertMany(templates, (err, data) => {
    logger.debug('[dataentry__templates] Done. ', err, data.result);

    const list = [];
    for(i = 0; i < 100; i++){
      const templateIndex = _.random(0, data.insertedIds - 1);
      const templateId = data.insertedIds[templateIndex];
      const template = templates[templateIndex];
  
      const contentRandom = _.random(0, 2);
      const contentList = [
        {
          content: { text: `${ faker.internet.email() } \n ${ faker.lorem.paragraphs(3)} ` },
          contentType: "text",
        },
        {
          content: { image: faker.image.technics() },
          contentType: "image",
        },
        {
          content: { link: 'assets/pdf-sample.pdf' },
          contentType: "pdf",
        }
      ];
  
      const selectedContent = contentList[contentRandom]
  
      const createdAt = new Date();
      const seconds = _.random(1, 240) * -1;
      const completed = faker.random.boolean();
      let queue = {
        content: selectedContent.content,
        contentType: selectedContent.contentType,
        organization: organization._id,
        template: templateId,
        title: template.title,
        properties: template.properties,
        completed: completed,
        flag: !completed,
        flagComment: completed ? '' : faker.lorem.paragraphs(1),
        startProcessAt: moment(createdAt).add(seconds, 'seconds').toDate(),
        createdAt: createdAt,
        updatedAt: createdAt
      };
      list.push(queue);
    }

    mongoose.connection.collection('dataentry__queues').insertMany(list, (err, data) => {
      logger.debug('[dataentry__queues] Done. ', err, data.result);
      done();
    })
  });
  
}

/**
 * ITEM_MANAGER Seed
 */
itemManagerSeed = (organization, token, done) => {
  /**
   * Another way to seed. Using seed inside microservice
   */
  // /api/seed/:organizationId
  
  let uri = `http://ai-item-manager:3000`;
  // if (config.environment === 'development'){
  //   uri = 'http://localhost:8080/item-manager';
  // }

  logger.debug('[ITEM_MANAGER] Request to ', uri, organization.domain);
  
  request.post({
    uri: `${ uri }/api/seed/${ organization._id }`,
    json: true,
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${ token }`,
      'organization-domain': organization.domain
    },
    qs: {
      'organization-domain': organization.domain
    },
    body: {
      organization: organization
    },
    timeout: 20 * 1000
  }, (err, response, body) => {
    logger.debug('[ITEM_MANAGER] Seed response. ', body);
    done(null);
  });
}

/**
 * MAGAZINE_CMS_ADMIN Seed
 */
// magazineCmsAdminSeed = (organization, done) => {
//   done(null);
// }

/**
 * DEVICE_MANAGER Seed
 */
deviceManagerSeed = (organization, token, done) => {
  let uri = `http://ai-device-manager:3000`;
    // if (config.environment === 'development'){
  //   uri = 'http://localhost:8080/device-manager';
  // }
  
  logger.debug('[DEVICE_MANAGER] Request to ', uri, organization.domain);

  request.post({
    uri: `${ uri }/api/seed/${ organization._id }`,
    json: true,
    headers: {
      'Content-type': 'application/json',
      'Authorization': `JWT ${ token }`,
      'organization-domain': organization.domain
    },
    qs: {
      'organization-domain': organization.domain
    },
    body: {
      organization: organization
    },
    timeout: 20 * 1000
  }, (err, response, body) => {
    logger.debug('[DEVICE_MANAGER] Seed response. ', body);
    done(null);
  });
}

/**
 * CAMERA_VIEWER Seed
 */
cameraViewerSeed = (organization, done) => {
  done(null);
}

/**
 * HR Seed
 */
hrSeed = (organization, done) => {
  const users = [];
  for (let i = 0; i < 5; i++){
    let referralCode = shortid.generate();
    users.push({
      "email": faker.internet.email(),
      "password" : 'aebrJDfmhsbIu870BPqx35x2miO2tu5g4JV30Mhe4DxIqOFZPx2XtE5IZBw3Sq9CBGM004SA6mVg91eLNgUDLA==',
      "salt": 'VFepSZUe/atKJKspEXJMBA==',
      "profile": {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        birthday : new Date()
      },
      referralCode: referralCode,
      roles: [
        {
          organization: organization._id,
          role: 'User',
          services: [{
            service: 'HR',
            role: 'User'
          }]
        }
      ],
      organization: organization._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSeedDummy: true,
    });
  }
  mongoose.connection.collection('users').insertMany(users, (err, data) => {
    logger.debug('[users] HR Done. ', err, data.result);
    const employees = [];
    users.forEach((user, index) => {
      
      employees.push({
        organization: organization._id,
        user: data.insertedIds[index],
        approved: true, 
        waitApprove: false,
        hourlyRate: _.random(10, 40),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    })
    mongoose.connection.collection('hr__employees').insertMany(employees, (err, data) => {
      logger.debug('[hr__employees] Insert. ', err, data.result);

      const trackers = [];
      const period = 28;
      const startDate = moment();
      const periodDates = [];
      for (let i = period; i >= 0; i--) {
        const startTime = startDate.clone().subtract(i, 'days');
        employees.forEach((employee, index) => {
          trackers.push({
            startTime: startTime.toDate(),
            endTime: startTime.clone().add(_.random(10, 480), 'minutes').toDate(),
            employee: data.insertedIds[index],
            user: employees[index].user,
            organization: organization._id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      mongoose.connection.collection('hr__tracker').insertMany(trackers, (err, data) => {
        logger.debug('[hr__tracker] Insert ', err, data.result);
        const _id = mongoose.Types.ObjectId();
        const fileStoreKey = `${ organization.domain }/HR/DOCUMENTS/${ _id }`;
        
        const hrDocument = {
          _id: _id,
          name: 'NON-DISCLOSURE AGREEMENT',
          fileStoreKey: fileStoreKey,
          contentType: 'application/pdf',
          size: 90211,
          type: 'NEW_HIRE',
          organization: organization._id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        fs.readFile(path.resolve('./src/assets/NON-DISCLOSURE AGREEMENT.pdf'), (err, body) => {
          s3.upload({
            Key: fileStoreKey,
            Body: body,
          }, (err, data) => {
            logger.debug('[hr__documents] Document upload ', err, data);
            mongoose.connection.collection('hr__documents').insertOne(hrDocument, (err, data) => {
              logger.debug('[hr__documents] Document insert ', err, data.result);
  
              const signingControls = [{ 
                    "updatedAt" : new Date(), 
                    "createdAt" : new Date(),
                    "type" : "DATE_SIGNED", 
                    "document" : _id, 
                    "pageNumber" : 1, 
                    "position" : {
                        "y" : 108, 
                        "x" : 191
                    }
                },
                { 
                    "updatedAt" : new Date(), 
                    "createdAt" : new Date(),
                    "type" : "FULL_NAME", 
                    "document" : _id, 
                    "pageNumber" : (1), 
                    "position" : {
                        "y" : (134), 
                        "x" : (123)
                    }
                },
                { 
                  
                    "updatedAt" : new Date(), 
                    "createdAt" : new Date(),
                    "type" : "SIGN_HERE", 
                    "document" : _id, 
                    "pageNumber" : (2), 
                    "position" : {
                        "y" : (619), 
                        "x" : (365)
                    }
                },
                { 
                    
                    "updatedAt" : new Date(), 
                    "createdAt" : new Date(),
                    "type" : "FULL_NAME", 
                    "document" : _id, 
                    "pageNumber" : (2), 
                    "position" : {
                        "y" : (644), 
                        "x" : (366)
                    }
                }
              ];
              mongoose.connection.collection('hr__documents_controls').insertMany(signingControls, (err, data) => {
                done();
              });
  
            })
          })
        })
        
        
      })
    })
  })
}

/**
 * PAYMENT_PROCESSOR Seed
 */
paymentProcessorSeed = (organization, done) => {
  done(null);
}


exports.clear = (organization, testModeDate, resetToDefault, token) => {
  return new Promise((resolve, reject) => {
    async.each(seedCollections, (collectionName, done) => {
      mongoose.connection.collection(collectionName)
      .deleteMany({ organization: organization._id, createdAt: { $gte: testModeDate }}, (err, data) => {
        logger.debug(`[${collectionName}] Cleared. `, data.result);
        done();
      })
    }, (err) => {
      if (resetToDefault){
        exports.seed(organization, token).then(() => {
          resolve();
        })
      } else {
        resolve();
      }
    })
  
  })
}