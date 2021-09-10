const Coinpayments = require('coinpayments'),
    path = require('path'),
    config = require(path.resolve('./config')),
    mongoose = require('mongoose'),
    lodash = require('lodash'),
    crypto = require("crypto"),
    logger = require('../core/logger'),
    Payment = mongoose.model('Payment'),
    async = require('async');

const coinpaymentsClient = new Coinpayments({
    key: config.coinpayments.key,
    secret: config.coinpayments.secret
});


exports.createTransactions = (req, res) => {
    const sentCurrency = req.body.sentCurrency;
    const amount = req.body.amount;

    async.waterfall([
        (done) => {
            Payment.count({ user: req.currentUser, status: 'PENDING' }).exec((err, count) => {
                if (count >= config.coinpayments.maxPending){
                    return done({
                        message: 'You already have 3 unfinished transfers, you cannot create any more...'
                    });
                }
                done();
            });
        },
        (done) => {
            const data = {
                'currency1': 'USD',
                'currency2': sentCurrency,
                'amount': amount,
                'custom': req.currentUser._id.toString(),
                // 'buyer_email': req.currentUser.email,
                'buyer_name': `${req.currentUser.profile.firstName} ${req.currentUser.profile.lastName}`
            };
            logger.debug('[coinpayments.notificationUrl]', config.coinpayments.notificationUrl)
            if (config.coinpayments.notificationUrl) {
                data.ipn_url = config.coinpayments.ipn_url;
            }
            coinpaymentsClient.createTransaction(data, (err, result) => {
                logger.debug('[createTransaction]', err, result);
                done(err, result);
            });
        },
        (txnData, done) => {
            const payment = new Payment({
                user: req.currentUser,
                amount: {
                    usd: amount,
                    coin: txnData.amount
                },
                sentCurrency: sentCurrency,
                externalId: txnData.txn_id,
                extra: {
                    address: txnData.address,
                    confirmsNeeded: txnData.confirms_needed,
                    status_url: txnData.status_url,
                    qrcode_url: txnData.qrcode_url,
                    timeout: txnData.timeout,
                    dest_tag: txnData.dest_tag
                }
            });
            payment.save(done);
        }
    ], (err, result) => {
        if (err) {
            return res.status(422).send({
                message: err.message || errorHandler.getErrorMessage(err)
            });
        }
        res.json(result);
    });

}

exports.coinpaymentsEvent = (req, res) => {
    if (!authIPN(req)) {
        logger.warn('[Coinpayments][AUTH]: Error ' + JSON.stringify(req.body));
        return res.sendStatus(204);
    }

    logger.info('[Coinpayments][IPN]: ' + JSON.stringify(req.body));
    
    Payment.findOne({ externalId: req.body.txn_id }).exec((err, payment) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (!payment) {
            return res.sendStatus(204);
        }
      
        payment.amount.received = req.body.received_amount || 0;
        payment.extra.confirmsReceived = req.body.received_confirms || 0;
        payment.extra.externalStatus = req.body.status;

        // logger.debug('[Coinpayments][status]: ', payment.extra.externalStatus);

        req.body.status = parseInt(req.body.status);

        if (req.body.status === -1) {
            payment.status = 'TIMEOUT';
        } else if (req.body.status < -1) {
            payment.status = 'ERROR';
        } else if (req.body.status == 100 || req.body.status == 2) {
            if (parseFloat(req.body.received_amount) != payment.amount.coin || payment.sentCurrency != req.body.currency2){
                logger.error('[Coinpayments][IPN]: Payment changed error' + JSON.stringify(req.body));
                return res.sendStatus(204);
            }
            // logger.info('[Coinpayments] Set PAID. ', payment._id.toString());
            payment.status = 'PAID';
        }

        payment.updatedAt = new Date();
        logger.info('[Coinpayments] Update. ', payment._id, payment.status, payment.extra.externalStatus);
        payment.save((err) => {
            if (err){
                return res.status(422).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
            logger.info('[Coinpayments] Saved. ', payment._id.toString());
            res.sendStatus(201);
        });
    });

    // Payment will post with a 'status' field, here are the currently defined values:
    // -2 = PayPal Refund or Reversal
    // -1 = Cancelled / Timed Out
    // 0 = Waiting for buyer funds
    // 1 = We have confirmed coin reception from the buyer
    // 2 = Queued for nightly payout (if you have the Payout Mode for this coin set to Nightly)
    // 3 = PayPal Pending (eChecks or other types of holds)
    // 100 = Payment Complete. We have sent your coins to your payment address or 3rd party payment system reports the payment complete
    // For future-proofing your IPN handler you can use the following rules:
    // <0 = Failures/Errors
    // 0-99 = Payment is Pending in some way
    // >=100 = Payment completed successfully
    // IMPORTANT: You should never ship/release your product until the status is >= 100 OR == 2 (Queued for nightly payout)!
}

const authIPN = (req) => {
    if (!req.body || (req.body && req.body.merchant != config.coinpayments.merchantId)) {
        return false;
    }

    const reqHmac = signHmacSha512(req.rawBody, config.coinpayments.IPNSecret);
    if (reqHmac != req.headers['hmac']) {
        return false;
    }

    return true;
}

const signHmacSha512 = (text, key) => {
    var hash = crypto.createHmac('sha512', key);
    hash.update(text);
    return hash.digest('hex');
}

exports.rates = (req, res) => {
    coinpaymentsClient.rates({ accepted: 1, short: 1 }, (err, result) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        const rates = [];
        for (const key in result) {
            if (result.hasOwnProperty(key)) {
                const rate = result[key];
                if (rate.accepted && rate.status === 'online') {
                    rates.push({
                        tx_fee: rate.tx_fee,
                        rate_btc: rate.rate_btc,
                        name: rate.name,
                        key: key
                    });
                }
            }
        }
        res.json(rates);
    });
}


exports.list = (req, res) => {
    Payment.find({ user: req.currentUser }).sort('-createdAt').exec((err, payments) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(payments);
    });
}

exports.getById = (req, res) => {
    Payment.findById(req.params.id).exec((err, payment) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (req.currentUser._id !== payment.user.toString()) {
            return res.sendStatus(403);
        }
        res.json(payment);
    });
}