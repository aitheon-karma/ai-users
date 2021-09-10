// const _ = require('lodash');
const mongoose = require('mongoose');

const Question = mongoose.model('Question');
const Answer = mongoose.model('Answer');
const errorHandler = require('../../core/errors.controller');


exports.create = (req, res) => {

  const parentOption = req.body.parentOption || (req.query.parentOption ? req.query.parentOption : undefined);
  req.body.parentOption = parentOption;

  // update answers for immediate parent.
  if (parentOption) {
    Question.findOne({ 'options._id': parentOption }, '_id').lean().exec((err, question) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }

      Answer.updateMany({ question: question._id }, { $set: { answered: false, configured: false } }).exec();
    });
  }

  const questionDb = new Question(req.body);
  questionDb.save((err, question) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(question);
  });
};


exports.update = (req, res) => {

  const { questionId } = req.params;
  // update answers for immediate parent.
  const {askAgain} = req.body;

  if (askAgain) {
    Answer.updateMany({ question: questionId }, { $set: { answered: false, configured: false } }).exec();
  }

  Question.findOneAndUpdate({ _id: questionId }, {
    $set: req.body
  }, { new: true }).exec((err, question) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(question);
  });
};

exports.list = (req, res) => {

  const { target, parentOption } = req.params;
  const { service } = req.query;

  //TODO: Refactor the variable names or move to another api
  const query = target === 'ORGANIZATION' ? { target, parentOption }: { target, userType: parentOption || {$ne: null} };

  if (service) {
    query.service = service;
  }

  Question.find(query).sort({ number: 1 }).exec((err, question) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(question);
  });
};

function processQuestion(question, allQuestions) {
  for (const option of question.options) {
    processOption(option, allQuestions);
  }
}

function processOption(option, allQuestions) {
  const optionChildQuestions = allQuestions.filter(q => (q.parentOption && q.parentOption.toString() == option._id));
  if (optionChildQuestions && optionChildQuestions.length) {
    option.childQuestions = optionChildQuestions.sort((q1, q2) => q1.number - q2.number);
    for (const question of optionChildQuestions) {
      processQuestion(question, allQuestions);
    }
  }
}

exports.listTree = (req, res) => {
  const { target } = req.params;
  const { questionId } = req.query;

  function init(allQuestions) {
    const rootQuestions = questionId ? allQuestions.filter(q => q._id === questionId) : allQuestions.filter(q => !q.parentOption);
    for (const question of rootQuestions) {
      processQuestion(question, allQuestions);
    }
    return res.jsonp(rootQuestions);
  }

  Question.find({ target }).lean().exec((err, questions) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    init(questions);
  });
}

exports.listTreeByServices = (req, res) => {
  const { target } = req.params;
  const rootServices = req.body;
  if(!Array.isArray(rootServices) || !target) {
    return res.status(400).send();
  }

  function init(allQuestions) {

    function isServiceIncluded(options) {
      let included = false;
      const optionsWithServices = options.filter(o => (o.enabledServices && o.enabledServices.length))
      const enabledServicesList = optionsWithServices.map(o => o.enabledServices).reduce((prev, current) => prev.concat(current),[]).map(s => s.service);

      for(const service of rootServices) {
          if(enabledServicesList.includes(service)) {
            included = true;
            break;
          }
      }
      return included;
    }
    const rootQuestions =  allQuestions.filter(q => (!q.parentOption && q.options && isServiceIncluded(q.options)));
    for (const question of rootQuestions) {
      processQuestion(question, allQuestions);
    }
    return res.jsonp(rootQuestions);
  }

  Question.find({ target }).lean().exec((err, questions) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    init(questions);
  });
}

exports.listTreeByService = (req, res) => {
  const { target, service } = req.params;

  Question.find({ target, service }).lean().exec((err, questions) => {

    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }

    const rootQuestions = questions.filter(q => !q.parentOption && q.options);
    for (const question of rootQuestions) {
      processQuestion(question, questions);
    }
    return res.jsonp(rootQuestions);
  });

}


exports.listByUserType = (req, res) => {
  const { target, userType } = req.params;
  Question.find({ target, userType }).sort({ number: 1 }).exec((err, question) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(question);
  });
};

exports.getById = (req, res) => {
  const { questionId } = req.params;

  const updateQuestion = ((err, question) => {
    if (err || !question) {
      return res.status(422).send({
        "message": "Could not load question"
      });
    }
    return res.jsonp(question);
  });

  Question.findOne({
    _id: questionId
  }).exec(updateQuestion);
};



exports.delete = (req, res) => {
  const { questionId } = req.params;

  Question.findByIdAndDelete({ _id: questionId }, ((err, question) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(question);
  }));
}
