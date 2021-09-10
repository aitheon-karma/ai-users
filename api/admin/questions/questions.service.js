const mongoose = require('mongoose');
const Question = mongoose.model('Question');
module.exports.getExistingQuestions = async function(service){
	return await Question.find({service: service._id});
}