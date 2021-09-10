/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const async = require('async');
const mongoose = require('mongoose');
const Organization = mongoose.model('Organization');
const Service = mongoose.model('Service');
const errorHandler = require('../../core/errors.controller');
const policy = require('../../core/policy.controller');
const multer = require('multer');
const externalRequest = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OrganizationFollowers = mongoose.model('OrganizationFollowers');


var tempStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'temp/')
    },
    filename: function (req, file, cb) {
        var ext = file.originalname.split('.')
        cb(null, Math.floor(Math.random() * Math.floor(9999)) + '-' + Date.now() + '.' + ext[ext.length - 1])
    }
});

var uploadToTempDirectory = multer({ storage: tempStorage }).single('file');


exports.publicProfile = (req, res) => {
  var organization = req.organization ? req.organization.toJSON() : {};
  res.json(organization);
}
  

exports.uploadCoverImage = (req, res) => {
  let organizationId = req.params.organizationId;
  // create a folder temp.
  var dir = './temp';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  uploadToTempDirectory(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err) || err
      });
    }
    
    let file = req.file;
    const imagePath = path.join(__dirname + '/../../../temp/');

    const fname = req.file.originalname;
    const filePath = imagePath + file.filename;

    // get access to Aitheon DRIVE
    const token = policy.getTokenFromRequest(req);
    let acl_url = `${config.driveURI}/api/acl`;
    let opt = {
        url: acl_url,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': `JWT ${token}`
        },
        json: true,
        body: {
            'level': 'FULL',
            'organization': organizationId,
            'service': {
                '_id': 'ORGANIZATIONS',
                'key': organizationId,
                'keyName': ''
            },
            'public': true
        }
    };
    externalRequest(opt, function (error, response, body) {

      if (error) {
        // DRIVE Access Denied / Request Error
        return res.status(422).send({
          message: errorHandler.getErrorMessage(error) || error
        });
      }

      if(response != null && response.statusCode == 200) {
        // GOT DRIVE PERMISSION. 
          // UPLOAD TO DRIVE
          const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
          const options = {
            url: url,
            method: 'POST',
            headers: {
                'Authorization': `JWT ${token}`
            },
            formData: {
              name: fname,
              service: JSON.stringify({
                "_id":"ORGANIZATIONS",
                "key" : organizationId
              }),
              file: {
                value: fs.createReadStream(filePath),
                options: {
                    filename: fname
                }
              }
            }
          };
          externalRequest(options, function (error, response, body) {
            //COMPLETED UPLOAD. NOW DELETE LOCAL FILE
          //   fs.unlink(profileImagePath, function (err) {
          //     if(err){
          //     console.log(err);}
          //   }); 
            if (error) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(error) || error
              });
            }
            if(response != null && response.statusCode == 200) {
              const jsonResponse = JSON.parse(body);
              let coverImage = {
                fileStoreKey: jsonResponse.storeKey,
                contentType: jsonResponse.contentType,
                size: jsonResponse.size
              };
              let coverImageUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;
              
              updateContent = { coverImage: coverImage, 'profile.coverImageUrl': coverImageUrl };

              Organization.findByIdAndUpdate(organizationId, updateContent).exec((err, result) => {
                  if (err) {
                      return res.status(422).send({
                      message: errorHandler.getErrorMessage(err)
                      });
                  }
                  res.json({
                      updatedAt: result.updatedAt.toString(),
                      coverImageUrl: coverImageUrl
                  });
              });
            }
            else{
              return res.status(422).send({
                message: "Error"
              });
            }
          });
      }
    });

  });
}
/// to remove organization cover image url.
exports.removeCoverImage = (req, res) => {
  let organizationId = req.params.organizationId;
  let updateContent = {};
  updateContent = { coverImage: undefined, 'profile.coverImageUrl': '' };

  Organization.findByIdAndUpdate(organizationId, updateContent).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      updatedAt: result.updatedAt.toString(),
      coverImageUrl: ''
    });
  });
}

// Oraganization avatar
exports.getAvatar = (req, res) => {
  console.log("Organization avatar Hit")
  let organizationId = req.params.organizationId
  Organization.findById(organizationId, 'profile.avatarUrl').lean().exec((err, oraganization) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (oraganization && oraganization.profile && oraganization.profile.avatarUrl) {
      return res.redirect(302, oraganization.profile.avatarUrl);
    }
    return res.redirect(302, '/users/assets/img/nophoto.png');

  })
}

exports.uploadAvatar = (req, res) => {
  // create a folder temp.
  var dir = './temp';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  uploadToTempDirectory(req, res, (err) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err) || err
      });
    }
    
    let file = req.file;
    const imagePath = path.join(__dirname + '/../../../temp/');

    const fname = req.file.originalname;
    const filePath = imagePath + file.filename;

    // get access to Aitheon DRIVE
    let organizationId = req.params.organizationId;
    const token = policy.getTokenFromRequest(req);
    let acl_url = `${config.driveURI}/api/acl`;
    let opt = {
        url: acl_url,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': `JWT ${token}`
        },
        json: true,
        body: {
            'level': 'FULL',
            'user': organizationId,
            'service': {
                '_id': 'USERS',
                'key': organizationId,
                'keyName': ''
            },
            'public': true
        }
    };
    externalRequest(opt, function (error, response, body) {

      if (error) {
        // DRIVE Access Denied / Request Error
        return res.status(422).send({
          message: errorHandler.getErrorMessage(error) || error
        });
      }

      if(response != null && response.statusCode == 200) {
        // GOT DRIVE PERMISSION. NOW RESIZE IMAGES AND UPLOAD
        
        // Use sharp to get the saved uploaded avatar and resize for profile image
        const profileImageFileName = organizationId + '-' + '200' + '.jpg';
        const profileImagePath = imagePath + profileImageFileName;
        sharp(imagePath + file.filename)
        .resize(200, 200, {
          fit: sharp.fit.inside
        })
        .toFile(profileImagePath)
        .then( data => {
          // RESIZE COMPLETED. UPLOAD TO DRIVE
          const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
          const options = {
            url: url,
            method: 'POST',
            headers: {
                'Authorization': `JWT ${token}`
            },
            formData: {
              name: profileImageFileName,
              service: JSON.stringify({
                "_id":"USERS",
                "key" : organizationId
              }),
              file: {
                value: fs.createReadStream(profileImagePath),
                options: {
                    filename: profileImageFileName
                }
              }
            }
          };
          externalRequest(options, function (error, response, body) {
            //COMPLETED UPLOAD. NOW DELETE LOCAL FILE
            fs.unlink(profileImagePath, function (err) {
              if(err){
              console.log(err);}
            }); 
            if (error) {
              return res.status(422).send({
                message: errorHandler.getErrorMessage(error) || error
              });
            }
            if(response != null && response.statusCode == 200) {
              const jsonResponse = JSON.parse(body);
              let avatar = {
                fileStoreKey: jsonResponse.storeKey,
                contentType: jsonResponse.contentType,
                size: jsonResponse.size
              };
              let avatarUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;
              
              // save to db.
              Organization.findByIdAndUpdate(organizationId, { avatar: avatar, 'avatarResolutions.profile': avatar, 'profile.avatarUrl': avatarUrl, 'profile.avatarResolutions.profile': avatarUrl }).exec((err, org) => {
                if (err) {
                  return res.status(422).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                }

                // CREATED PROFILE IMAGE. NOW CREATE REST OF THE SIZES
                cropAndUpdateImageUrl(token, file.filename, fname, imagePath, organizationId, filePath);

                res.json({
                  updatedAt: org.updatedAt.toString(),
                  profile: {
                    avatarUrl: avatarUrl
                  }
                });
              });

            }
            else{
              return res.status(422).send({
                message: "Error"
              });
            }
          });
        })
        .catch( err => {
          //delete file.
          fs.unlink(imagePath + organizationId + '-' + '200' + '.jpg', function (err) {
          }); 
          return res.status(422).send({
            message: "Error"
          });
        });
      }
      else{
        return res.status(422).send({
          message: "Not authenticated"
        });
      }
    });

  });
}

// CROP the uploaded image to desired sizes
// UPLOAD the cropped image to DRIVE
// UPDATE database records
const cropAndUpdateImageUrl = (token, file_filename, ofname, imagePath, organizationId, ofilePath) => {
  // upload original image.
  // crop images and update to db.
  // 200-profile, 100-thumbnail, 50-mini, 20-micro 
  var sizes = [100, 50, 20];

  const resize = size => sharp(imagePath + file_filename)
  .resize(size, size,{
    fit: sharp.fit.inside
  })
  .toFile(imagePath + organizationId + '-' + size + '.jpg')
  .then( data => { });

  Promise
  .all(sizes.map(resize))
  .then(() => {
    updateImageUrl('Micro', token, ofname, imagePath, organizationId, ofilePath);
    updateImageUrl('Mini', token, ofname, imagePath, organizationId, ofilePath);
    updateImageUrl('Thumbnail', token, ofname, imagePath, organizationId, ofilePath);
    updateImageUrl('Original', token, ofname, "", organizationId, ofilePath);
  });
}

// To update micro image url.
const updateImageUrl = (type, token, fileName, imagePath, organizationId, originalFilePath) => {
  let filePath = '';
  if(type == 'Micro') {
    filePath = imagePath + organizationId + '-' + '20' + '.jpg';
  }
  else if(type == 'Mini'){
    filePath = imagePath + organizationId + '-' + '50' + '.jpg';
  }
  else if(type=='Thumbnail'){
    filePath = imagePath + organizationId + '-' + '100' + '.jpg';
  }
  else if(type == 'Original'){
    filePath = originalFilePath;
  }

  const url = `${config.driveURI}/api/documents?isPublic=true&signedUrlExpire=315569520`;
  const options = {
    url: url,
    method: 'POST',
    headers: {
        'Authorization': `JWT ${token}`
    },
    formData: {
      name: fileName,
      service: JSON.stringify({
        "_id":"USERS",
        "key" : organizationId
      }),
      file: {
        value: fs.createReadStream(filePath),
        options: {
            filename: fileName
        }
      }
    }
  };
  
  externalRequest(options, function (error, response, body) {
    // delete file.
    if(type != 'Original'){
      fs.unlink(filePath, function (err) {
      });
    }
    if (error) {
      return;
    }
    if(response != null && response.statusCode == 200)
    {
      const jsonResponse = JSON.parse(body);
      const imageData = {
        fileStoreKey: jsonResponse.storeKey,
        contentType: jsonResponse.contentType,
        size: jsonResponse.size
      }
      const imageUrl = jsonResponse.signedUrl + `&refresh=${new Date().getTime()}`;
      if(type == 'Micro') {
        Organization.findByIdAndUpdate(organizationId, { 'avatarResolutions.micro': imageData, 'profile.avatarResolutions.micro': imageUrl }).exec((err, organization) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if(type == 'Mini') {
        Organization.findByIdAndUpdate(organizationId, { 'avatarResolutions.mini': imageData, 'profile.avatarResolutions.mini': imageUrl }).exec((err, organization) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if(type=='Thumbnail') {
        Organization.findByIdAndUpdate(organizationId, { 'avatarResolutions.thumbnail': imageData, 'profile.avatarResolutions.thumbnail': imageUrl }).exec((err, organization) => {
          //deleteTempFile(ofilePath);
        });
      }
      else if(type=='Original') {
        Organization.findByIdAndUpdate(organizationId, { 'avatarResolutions.original': imageData, 'profile.avatarResolutions.original': imageUrl }).exec((err, organization) => {
          //deleteTempFile(filePath);
        });
      }
    }
  });
  //deleteTempFile(originalFilePath);
}

const deleteTempFile = (filePath) => {
  fs.unlink(filePath, function (err) {
    if(err){
      console.log("Error occured while deleting file");
    }
  });
}
/// to remove organization cover image url.
exports.removeAvatarImage = (req, res) => {
  let organizationId = req.params.organizationId;
  let updateContent = {};
  updateContent = { avatar: undefined, 'profile.avatarUrl': '' };

  Organization.findByIdAndUpdate(organizationId, updateContent).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      updatedAt: result.updatedAt.toString(),
      avatarUrl: ''
    });
  });
}

/// to update organization intro
exports.updateIntro = (req, res) => {
  let organizationId = req.params.organizationId;

  let updateContent = {};

  updateContent = { 'profile.intro': req.body.intro, 'profile.introBackgroundStyle': req.body.introBackgroundStyle ,'profile.introTextStyle': req.body.introTextStyle };

  Organization.findByIdAndUpdate(organizationId, updateContent).exec((err, result) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json({
      updatedAt: result.updatedAt.toString()
    });
  });
}

exports.updateGeneralInfo = (req,res) => {
  let organizationId = req.params.organizationId;
  let updateContent = {};
  updateContent = {'profile.website':req.body.website, 'profile.address':req.body.address,'profile.phone':req.body.phone,'profile.facebookUrl': req.body.facebookUrl, 'profile.foursquareUrl': req.body.foursquareUrl, 'profile.direction.latitude': req.body.direction.latitude, 'profile.direction.longitude': req.body.direction.longitude, 'profile.openingTime': req.body.openingTime, 'profile.closingTime': req.body.closingTime};

  Organization.findByIdAndUpdate(organizationId, updateContent,{new:true}).exec((err,result) =>{
    if(err){
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    return res.json(result.profile);
  });
}

exports.follow = (req,res) => {
  let organizationId = req.params.organizationId;
  let userId = req.currentUser._id;
  
  const conditions = {
    'org': organizationId,
    'user':userId
  };
  OrganizationFollowers.findOne(conditions).exec((findErr, findRes) => {
    if (findErr) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(findErr)
        });
    }
    // 1 - following, 2 - unfollowing.
    if (findRes !== null && findRes !== undefined) {
      return res.status(400).send({
        message: "Already following"
      });
    } else {
      let organizationFollower = new OrganizationFollowers({'org' : organizationId, 'user' : req.currentUser._id});

      organizationFollower.save((err, follower) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if (follower === null || follower === undefined) {
          return res.status(400).send({
              message: 'follow failed'
          });
        }
        return res.json({
            status: 1,
            message: 'Followed'
        });
      });
    }
  });
}

exports.unfollow = (req,res) => {
  let organizationId = req.params.organizationId;
  let userId = req.currentUser._id;
  
  const conditions = {
    'org': organizationId,
    'user':userId
  };

  OrganizationFollowers.findOneAndDelete(conditions).exec((deleteErr, deleteRes) => {
      if (deleteErr) {
          return res.status(400).send({
              message: errorHandler.getErrorMessage(deleteErr)
          });
      }
      if (deleteRes === null || deleteRes === undefined) {
          return res.status(400).send({
              message: 'unfollow failed'
          });
      }
      return res.json({
          status: 1,
          message: 'Unfollowed'
      });
  });
}

exports.getFollowStatus = (req,res) => {
  let organizationId = req.params.organizationId;
  let userId = req.currentUser._id;
  
  const conditions = {
    'org': organizationId,
    'user':userId
  };
  OrganizationFollowers.findOne(conditions).exec((findErr, findRes) => {
    if (findErr) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(findErr)
        });
    }
    // 1 - following, 2 - unfollowing.
    if (findRes !== null && findRes !== undefined) {
      return res.json({
        status: 1,
        message: 'Following'
      });
    } else {
      return res.json({
        status: 2,
        message: 'Unfollowing'
      });
    }
  });
}

exports.getOrganizationFollowers = (req,res) => {
  let organizationId = req.params.organizationId;
  
  OrganizationFollowers.find({ org: organizationId}).populate('user').exec((err, organizationfollowers) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(organizationfollowers);
  });
}