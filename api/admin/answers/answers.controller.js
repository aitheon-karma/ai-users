// const _ = require('lodash');
const mongoose = require('mongoose');

const Answer = mongoose.model('Answer');
const errorHandler = require('../../core/errors.controller');


exports.create = (req, res) => {

  const body = req.body;
  const userId = req.currentUser._id;
  const organizationId = req.headers['organization-id'];
  const query = { question: body.question };
  if (organizationId) {
    query.organization = organizationId;
  } else {
    query.user = userId;
  }
  Answer.findOne(query).exec((err, answer) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }

    if (answer) {
      const newAnswer = { ...answer.toObject(), ...body };
      Answer.findByIdAndUpdate(answer._id, newAnswer, { upsert: true, new: true }).exec((err, result) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err),
          });
        }
        return res.jsonp(result);
      });
    } else {
      const answerDb = new Answer(body);
      answerDb.answeredBy = userId;
      answerDb.answered = true;
      if (organizationId) {
        answerDb.organization = organizationId;
      } else {
        answerDb.user = userId;
      }
      answerDb.save((err, result) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err),
          });
        }
        return res.jsonp(result);
      });
    }
  });

};

exports.list = (req, res) => {
  const userId = req.currentUser._id;
  const organizationId = req.headers['organization-id'];

  const query = {};
  if (organizationId) {
    query.organization = organizationId;
  } else {
    query.user = userId;
  }
  Answer.find(query).exec((err, answers) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(answers);
  });
};


exports.update = (req, res) => {

  const { answerId } = req.params;


  Answer.findByIdAndUpdate(answerId, {
    $set: req.body
  }, { new: true }).exec((err, answer) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(answer);
  });


}

exports.delete = (req, res) => {
  const { answerId } = req.params;

  Answer.findByIdAndDelete(answerId, ((err, answer) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(answer);
  }));
}

exports.deleteByQuestion = (req, res) => {
  const { questionId } = req.params;
  const userId = req.currentUser._id;
  const organizationId = req.headers['organization-id'];

  const query = { question: questionId };
  if (organizationId) {
    query.organization = organizationId;
  } else {
    query.user = userId;
  }
  Answer.deleteOne(query, ((err, answer) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    return res.jsonp(answer);
  }));
}

exports.removePrevious = (req, res) => {
  const answers = req.body;

  if (!answers) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err),
    });
  }

  answers.forEach(answer => {
    Answer.findByIdAndRemove(answer._id, ((err, answer) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err),
        });
      }
    }));
  });

  return res.json({});
}
