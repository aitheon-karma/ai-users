const questionsService = require('../admin/questions/questions.service.js');
const mongoose = require('mongoose');
const ServiceSetup = mongoose.model('ServiceSetup');
module.exports.addCheckServiceSetup = async function(organization, service){
  const setup = {
    organization: organization._id,
    service: service._id,
    unconfigured: true
  };
  let questions = await questionsService.getExistingQuestions(service);
	if(questions && questions.length > 0){
		let result = await ServiceSetup.findOneAndUpdate(
      setup,
      {$set: setup},
      {upsert: true, new: true}
    );
    return result;
  }else{
    let result = await ServiceSetup.findOne(setup);
    return result;
  }
}