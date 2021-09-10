const path = require('path'),
      nodemailer = require("nodemailer"),
      inlineCss = require('nodemailer-juice'),
      config = require(path.resolve('./config'));

class Mailer {

  constructor() {
    // console.log('Mailer constructor');
    this._smtpTransport = null;
  }

  get instance() {
    return this._smtpTransport;
  }

  sendMail(mailOptions, callback){
    // logger.debug(`[MAILER] send mail to: ${ mailOptions.to}; form: ${ mailOptions.from }`)
    this._smtpTransport.sendMail(mailOptions, callback);
  }

  init() {
    console.log('Mailer init...');
    const smtpTransport = nodemailer.createTransport(config.mailer);
    smtpTransport.use('compile', inlineCss());

    this._smtpTransport = smtpTransport;
  }
}

const mailer = new Mailer();
module.exports = mailer;