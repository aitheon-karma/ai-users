const mongoose = require('mongoose');
const https = require('https');
const Service = mongoose.model('Service');
const Organization = mongoose.model('Organization');
const {ErrorConflict, ErrorNotFound, ErrorUndefinedState} = require('../core/errors.controller.js');
const servicesSetupService = require('../service-setups/service-setups.service.js');
module.exports.addServiceToOrg = async function(organization, serviceId){
  let result = {serviceSetup: false};
  result.service = await addService(organization, serviceId);
  result.serviceSetup = await servicesSetupService.addCheckServiceSetup(organization, result.service);
  return result;
};

module.exports.removeServiceFromOrg = async function(organization, serviceId) {
  let result = {serviceSetup: false};
  result.service = await removeService(organization, serviceId);
  return result;
}

module.exports.getLocationCoordinates = function(locationAddress) {
  const address = Object.values(locationAddress).join(' ');
  return new Promise((resolve, reject) => {
    https
      .get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${config.googleMapKey}`, (res) => {

        const { statusCode } = res;
        let rawData = '';

        if (statusCode !== 200) {
          reject(new Error('Google Map Api Request Failed.\n' +
            `Status Code: ${statusCode}`));
        }

        res.setEncoding('utf8');

        res.on('data', (chunk) => { rawData += chunk; });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            const locationCoordinates = parsedData.results[0];
            if (parsedData.status === 'OK') {
              resolve({
                lat: parsedData.results[0].geometry.location.lat,
                lng: parsedData.results[0].geometry.location.lng,
                formattedAddress: locationCoordinates.formatted_address
              });
            } else {
              resolve({});
            }
          } catch (e) {
            reject(new Error(e.message));
          }
        });
      }).on('error', (e) => {
      reject(new Error(`Google API error: ${e.message}`));
    });
  })
}

async function addService(organization, serviceId){
	let service = await Service.findById(serviceId);
  if(!service){
		throw new ErrorNotFound('Service not found');
  }
  if(organization.services.indexOf(service._id) !== -1){
		throw new ErrorConflict('Service already present in organization');
  }
  let {nModified} = await Organization.updateOne(
    {_id: organization._id},
    {$push: { 'services': service._id}}
  );
  if(nModified !== 1){
		throw new ErrorUndefinedState('Services modification fail');
  }
  broker.instance.emit(`GraphsService.organizationServiceChange`, { action: 'ADDED', organization: organization._id, service: serviceId },[`SYSTEM_GRAPH${config.environment === 'production' ? '' : '_DEV'}`]);
  return service;
}

async function removeService(organization, serviceId){
	let service = await Service.findById(serviceId);
  if(!service){
		throw new ErrorNotFound('Service not found');
  }
  if(organization.services.indexOf(service._id) === -1){
		throw new ErrorNotFound('Service not present in organization');
  }
  let {nModified} = await Organization.updateOne(
    {_id: organization._id},
    {$pull: { 'services': service._id}}
  );
  if(nModified !== 1){
  	throw new ErrorUndefinedState('Services modification fail');
  }
  broker.instance.emit(`GraphsService.organizationServiceChange`, { action: 'REMOVED', organization: organization._id, service: serviceId },[`SYSTEM_GRAPH${config.environment === 'production' ? '' : '_DEV'}`]);
  return service;
}
