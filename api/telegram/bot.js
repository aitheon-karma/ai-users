const TelegramBot = require('node-telegram-bot-api'),
      mongoose = require('mongoose'),
      User = mongoose.model('User'),
      UserAirdrop = mongoose.model('UserAirdrop'),
      async = require('async'),
      schedule = require('node-schedule'),
      cache = require('memory-cache'),
      limit = require("simple-rate-limiter"),
      logger = require('../core/logger'),
      config = require('../../config');
 
// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegram.botToken;
let bot;

const scheduledJobs = [];

exports.init = () => {
  if (!token){
    return logger.warn('[telegram_bot] token missing');
  }
  // Create a bot that uses 'polling' to fetch new updates
  
  if (config.telegram.pooling == true){
    bot = new TelegramBot(token, { polling: true });
  } else {
    bot = new TelegramBot(token, { polling: false, webHook: true });
    // This informs the Telegram servers of the new webhook.
    const hookUrl = `https://${ config.domain }/users/api/telegram-bot/${ token }`;
    // bot.setWebHook(hookUrl);
    // hookUrl = 'https://webhook.site/f9e03ca7-2d43-4b1c-a966-6085785de7fe'
    logger.debug('[telegram_bot] settings webhook', hookUrl);
    bot.setWebHook(hookUrl);
  }

  // Matches "/start [whatever]"
  bot.onText(/\/start (.+)/, (msg, match) => {
    // logger.debug('[telegram_bot] [onText] ', msg);
    const chatId = msg.chat.id;
    const telegramKey = match[1];
    const userId = cache.get(`telegram_${ telegramKey }`);
    const telegramId = msg.from.id;
    if (!userId){
      return bot.sendMessage(chatId, 'Sorry, but link is expired or incorrect. Please go to website and click button again.');
    }

    User.findOne({ 'profile.telegram.id': telegramId, _id: { $ne: userId } }, (err, exUser) => {
      if (err){
        logger.error('[telegram_bot] ', err);
        return bot.sendMessage(chatId, 'Sorry, but I need some to time charge my battery. Will back shortly.'); 
      }
      if (exUser){
        logger.error('[telegram_bot] same telegram id', telegramId);
        return bot.sendMessage(chatId, 'Sorry, but this telegram account already attached.'); 
      }

      User.findByIdAndUpdate(userId, { $set: {
        'profile.telegram': {
          id: msg.from.id,
          username: msg.from.username || '',
          chatId: chatId,
          firstName: msg.from.first_name || '',
          lastName: msg.from.last_name || ''
        }
      }}).exec((err, user) => {
        if (err){
          logger.error('[telegram_bot] ', err);
          return bot.sendMessage(chatId, 'Sorry, but I need some to time charge my battery. Will back shortly.'); 
        }
        bot.sendMessage(chatId, `Welcome ${ user.profile.firstName }! Now you #AitheonPowered!`); 
        bot.sendMessage(chatId, `You have added your telegram to your profile.`); 
        bot.sendMessage(chatId, `Please join our official telegram channel https://t.me/aitheon`); 
  
        /**
         * Recheck new user after 5 minutes
         */

        const afterAddChecker = (userId, telegramId) => {
          logger.debug('[scheduledJobs] Cheking user after telegram added. ', userId, telegramId);
            limitedCheckAirdropStatus(userId, telegramId, (checkResult) => {
              saveAirdropStatus(userId, telegramId, checkResult, () => {
                const jobItem = scheduledJobs.find((s) => {
                  return s.userId === userId && s.telegramId === telegramId;
                });
                if (!jobItem){
                  logger.warn('[scheduledJobs] No job item?', userId, telegramId);
                  return;
                }
                jobItem.counter = jobItem.counter + 1;
                // groupJoined: false, nameMatched: false
                logger.debug('[scheduledJobs] Checker telegram done. ', userId, telegramId, checkResult);
                if (jobItem.counter >= 30 || (checkResult.groupJoined && checkResult.nameMatched)){
                  logger.debug('[scheduledJobs] Cleared timeout ', userId, telegramId);
                  clearTimeout(jobItem.timeoutId);
                  const jobItemIndex = scheduledJobs.find((s) => {
                    return s.userId === userId && s.telegramId === telegramId;
                  });
                  if (jobItemIndex > -1){
                    scheduledJobs.splice(jobItemIndex, 1);
                  }
                } else {
                  logger.debug('[scheduledJobs] Reschedule timeout ', userId, telegramId);
                  jobItem.timeoutId = setTimeout(() => {
                    afterAddChecker(userId, telegramId);
                  }, config.telegram.timeoutCheck);
                }
              });
          });
        }

        scheduledJobs.push({
          userId: userId,
          telegramId: telegramId,
          counter: 0,
          timeoutId: setTimeout(() => {
            afterAddChecker(userId, telegramId);
          }, config.telegram.timeoutCheck)
        });
        return;
      });
    });
  });

  // Listen for any kind of message. There are different kinds of
  // messages.
  // bot.on('message', (msg) => {
  //   const chatId = msg.chat.id;

  //   // send a message to the chat acknowledging receipt of their message
  //   bot.sendMessage(chatId, 'Received your message');
  // });

  bot.on('polling_error', (err) => {
    logger.error('[telegram_bot] polling_error: ', err);
  });
  bot.on('webhook_error', (err) => {
    logger.error('[telegram_bot] webhook_error: ', err);
  });

  logger.debug('[startAirdropChecker] init started ');
  // startAirdropChecker();
}


const limitedCheckAirdropStatus = limit((userId, telegramId, done) => {
  checkAirdropStatus(userId, telegramId, done);
}).to(30).per(1000);

exports.webHookMessage = (req, res) => {
  // logger.debug('[telegram_bot] [webHookMessage] ', req.body);
  bot.processUpdate(req.body);
  res.sendStatus(201);
}

const nameMatchRegex = new RegExp('(Aitheon ICO)','i');

const checkAirdropStatus = (userId, telegramId, done) => {
  if (!telegramId){
    return done({ groupJoined: false, nameMatched: false });
  }
  bot.getChatMember(config.telegram.groupId, telegramId).then((result) => {
    const response = { groupJoined: false, nameMatched: false, checkDate: new Date() };
    if (!result){
      return done(response);
    }
    if (result.status === 'member'||  result.status === 'administrator' || result.status === 'creator'){
      response.groupJoined = true;
    }
    if (nameMatchRegex.test(result.user.first_name) || nameMatchRegex.test(result.user.last_name)){
      response.nameMatched = true;
    }
    logger.debug('[checkAirdropStatus] ', result.status, userId, telegramId, result.user.first_name, result.user.last_name, response);
    
    return done(response);
  }).catch((err) => {
    done({ groupJoined: false, nameMatched: false });
    logger.error('[checkAitheonJoined]' + userId + '; telegramId; ' + telegramId + '; error', err);
  });
}

const startAirdropChecker = () => {
  User.find({ 'profile.telegram.id': { $exists: true } }, '_id profile').exec((err, users) => {
    if (err){
      logger.error('[startAirdropChecker] error', err);
      return;
    }

    async.each(users, (user, done) => {
      limitedCheckAirdropStatus(user._id, user.profile.telegram.id, (result) => {
        saveAirdropStatus(user._id, user.profile.telegram.id, result, done);
      });
    }, (done) => {
      logger.debug('[startAirdropChecker] DONE.');
    });
  });
}

const saveAirdropStatus = (userId, telegramId, result, done) => {
  User.updateOne({ _id: userId }, { $set: {
    'profile.telegram.groupJoined': result.groupJoined,
    'profile.telegram.nameMatched': result.nameMatched
  }}).exec((err) => {
    if (err){
      logger.error('[saveAirdropStatus] save user error ', err);
      return done();
    }

    const userAirdrop = new UserAirdrop({
      user: userId,
      checkDate: result.checkDate,
      groupJoined: result.groupJoined,
      nameMatched: result.nameMatched
    });
    userAirdrop.save((err) => {
      if (err){
        logger.error('[saveAirdropStatus] save air drop error ', err);
        return done();
      }
      logger.debug('[saveAirdropStatus] Check history saved.', userId.toString());
      done();
    })
  });
}


exports.checkAirdropStatus = checkAirdropStatus;

/**
 * Morning job
 */
// schedule.scheduleJob('0 8 * * *', (fireDate) => {
//   logger.debug('[startAirdropChecker] started ', fireDate);
//   startAirdropChecker();
// });

/**
 * Evening job
 */
// schedule.scheduleJob('0 20 * * *', (fireDate) => {
//   logger.debug('[startAirdropChecker] started ', fireDate);
//   startAirdropChecker();
// });