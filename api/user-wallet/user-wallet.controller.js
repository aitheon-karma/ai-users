/*
 * Module dependencies.
 */
const _ = require('lodash'),
      mongoose = require('mongoose'),
      limit = require("simple-rate-limiter"),
      request = require("request"),
      async = require('async'),
      UserWallet = mongoose.model('UserWallet'),
      CryptoSettings = mongoose.model('CryptoSettings'),
      policyController = require('../core/policy.controller'),
      Web3 = require('web3'),
      errorHandler = require('../core/errors.controller');

/*
 * Get
 */
exports.getSettings = (req, res) => {
  Settings.findOne({}).lean().exec((err, settings) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } 

    let result = settings|| defaultSettings;

    return res.json(_.pick(result, 'dashboard'));
  });
};

/*
 * Get
 */
exports.myWallet = (req, res) => {
  UserWallet.findOne({ user: req.currentUser }).exec((err, userWallet) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    CryptoSettings.findOne({},(err, cryptoSettings) => {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      // cryptoSettings.ETH.USD = 875;

      return res.json({ 
        userWallet: userWallet || { ethWalletAddress: '', litecoinWalletAddress: '', bitcoinWalletAddress: '', tokens: 0 },
        cryptoSettings: cryptoSettings
      });
    })
  });
};


const deniedETHAddresses = [
  // contract address
  '0x2750662b7d571302cfd6b2f2f8babcfd637d4168',
  // pool1
  '0x6b6b30a083109cbf51e7f9a92d3efdf88c396bdf',
  // pool2
  '0x225103715ab26f6579ef0d391e7764f95e547528',
  // pool3
  '0xf58e3f60fc2a501387b9c78311ede6e17adf7320',
  // token sale  2
  '0xad358ebdf3fb63a7a4a92687ad8c2bf4b1071d22',
  // eth
  '0x47a7fE58E439D25e83394262B32ef5a6F118e6D9',
  // creator address
  '0x4f0eb33f0706c72e6946cfd4f89a1a9e8ef06723'

// ????
  // 0xa5CF4d87D8d3d9856d92b89e20b4ac9013153bFa
];

/*
 * Save wallet
 */
exports.saveWallet = (req, res) => {
  const userWallet = req.body;
  if (userWallet.ethWalletAddress){
    userWallet.ethWalletAddress = _.trim(userWallet.ethWalletAddress);
    if (!isAddress(userWallet.ethWalletAddress) || deniedETHAddresses.indexOf(userWallet.ethWalletAddress.toLowerCase()) > -1){
      return res.status(422).send({
        message: 'Address is not valid'
      });
    }
  }

  const updateWallet = {};
  if (userWallet.ethWalletAddress){
    updateWallet.ethWalletAddress = userWallet.ethWalletAddress;
  }
  if (userWallet.bitcoinWalletAddress){
    updateWallet.bitcoinWalletAddress = userWallet.bitcoinWalletAddress;
  }
  if (userWallet.litecoinWalletAddress){
    updateWallet.litecoinWalletAddress = userWallet.litecoinWalletAddress;
  }
  
  UserWallet.findOneAndUpdate({ user: req.currentUser }, updateWallet, { upsert: true, new: true }).exec((err, userWallet) => {
    if (err) {
      let errMessage = errorHandler.getErrorMessage(err);
      if (err.code === 11000){
        errMessage = `This wallet address is already exist`;
      }
      return res.status(422).send({
        message: errMessage
      });
    }
    if (!req.body._id){
      return res.json(userWallet);
    }
    CryptoSettings.findOne({},(err, cryptoSettings) => {
      let contracts = _.uniq([cryptoSettings.tokenSaleAddress, '0x2750662b7d571302cfd6b2f2f8babcfd637d4168', '0xad358ebdf3fb63a7a4a92687ad8c2bf4b1071d22']);
      getWeb3TokenBalance(userWallet, contracts, (err, wallet) => {
      // getUserTokenBalance(cryptoSettings.tokenSaleAddress, userWallet, (err, wallet) => {
        if (wallet){
          res.json(wallet);
        } else {
          res.json(userWallet);
        }
      });
    });
  });
};

const previousContracts = [
  // sale 1
  '0x2750662b7d571302cfd6b2f2f8babcfd637d4168',
  // token sale  2
  '0xad358ebdf3fb63a7a4a92687ad8c2bf4b1071d22',
  // March 1 - 3
  '0xa5CF4d87D8d3d9856d92b89e20b4ac9013153bFa'
];

// // Prevent double run
// let tokenHoldersCheckerRunning = false;
// const tokenHoldersChecker = () => {
//   if (tokenHoldersCheckerRunning){
//     logger.debug('[tokenHoldersChecker] already running');
//     return;
//   }
//   tokenHoldersCheckerRunning = true;
//   try {
//     CryptoSettings.findOne({},(err, cryptoSettings) => {
//       if (err){
//         tokenHoldersCheckerRunning = false;
//         logger.error('[tokenHoldersChecker] cryptoSettings error', err);
//         return startTokenHoldersChecker();
//       }
//       const contractAddress = cryptoSettings.tokenSaleAddress;
//       if (!contractAddress){
//         tokenHoldersCheckerRunning = false;
//         startTokenHoldersChecker();
//         return; // logger.debug('[tokenHoldersChecker] no contractAddress');
//       }

//       if (contractAddress === 'SALE CLOSED'){
//         tokenHoldersCheckerRunning = false;
//         startTokenHoldersChecker();
//         return logger.debug('SALE CLOSED');
//       }
    
//       UserWallet.count({ ethWalletAddress: { $ne: null }}).exec((err, total) => {
//         if (err){
//           tokenHoldersCheckerRunning = false;
//           logger.error('[tokenHoldersChecker] cryptoSettings error', err);
//           return startTokenHoldersChecker();
//         }

//         let contracts = _.uniq(previousContracts.concat([contractAddress]));
//         pagingSyncWallets(contracts, 0, total);

//       })



//     });
//   } catch (err) {
//     tokenHoldersCheckerRunning = false;
//     logger.error('[tokenHoldersChecker] Unhandled error', err);
//     startTokenHoldersChecker();
//   }
// }

// const pagingSyncWallets = (contracts, skip, total) => {
//   syncWallets(contracts, skip, total, () => {
//     const newSkip = skip + (config.etherscan.checkerLimit * 1);
//     if (newSkip > total){
//       tokenHoldersCheckerRunning = false;
//       logger.debug('[tokenHoldersChecker] ALL SYNC DONE. ');
//       startTokenHoldersChecker();
//     } else {
//       pagingSyncWallets(contracts, newSkip, total);
//     }
//   });
// }

// let limitedGetUserTokenBalance = limit((contracts, userWallet, done) => {
//   getWeb3TokenBalance(userWallet, contracts, done);
// }).to(30).per(1000);

// const syncWallets = (contracts, skip, total, syncDone) => {
//   const limitCount = (config.etherscan.checkerLimit * 1);
//   logger.debug(`[tokenHoldersChecker] Sync ${ skip }/${total}`);
//   UserWallet.find({ ethWalletAddress: { $ne: null }}).skip(skip).limit(limitCount).exec((err, userWallets) => {
//     if (err){
//       syncDone();
//       logger.error('[tokenHoldersChecker] userwallet error', err);
//       return;
//     }
//     logger.debug('[tokenHoldersChecker] Sync user wallets. Count:', userWallets.length);

//     if (userWallets.length === 0){
//       logger.debug(`[tokenHoldersChecker] Zero paging, done.`);
//       syncDone();
//       return;
//     }
    
//     let totalRequests = userWallets.length;
//     userWallets.forEach((userWallet) => {
//       limitedGetUserTokenBalance(contracts, userWallet, () => {
//         totalRequests--;
//         if (totalRequests === 0){
//           logger.debug(`[tokenHoldersChecker] Sync Done ${ skip }/${ total }`);
//           syncDone();
//         }
//       });
//     });

//   });
// }

// const tokenSupply = 1000000000000000000;

// const getUserTokenBalance = (contractAddress, userWallet, done) => {
//   // logger.debug('[tokenHoldersChecker] Checking user: ', userWallet.ethWalletAddress);
//   if (userWallet.ethWalletAddress && !isAddress(userWallet.ethWalletAddress)){
//     logger.debug('[tokenHoldersChecker] ETH address is not valid. ignoring... ', userWallet.ethWalletAddress, userWallet.user.toString());
//     return done(null);
//   }

//   if (contractAddress === 'SALE CLOSED'){
//     done(null);
//     logger.debug('SALE CLOSED from User wallet update');
//     return;
//   }

//   const url = `${ config.etherscan.apiUrl }?module=account&action=tokenbalance&contractaddress=${ contractAddress }&address=${ userWallet.ethWalletAddress }&tag=latest&apikey=${ config.etherscan.apiKey }`;
//   request(url, { json: true, timeout: 10000 }, (err, response, body) => {
//     if (err) {
//       logger.error('[tokenHoldersChecker] Get token value ', userWallet.ethWalletAddress, url, err);
//       return done(null);
//     }
//     if (!body){
//       logger.error('[tokenHoldersChecker] Get token no body', userWallet.ethWalletAddress);
//       return done(null);
//     }
//     if (body.status === '0'){
//       logger.warn('[tokenHoldersChecker] NOT OK', body, url);
//       return done(null);
//     } else if (body.status === '1'){
//       // logger.debug('Checking user done: ', userWallet.ethWalletAddress);
//       /** saving token result */
//       userWallet.tokens = parseInt(body.result) / tokenSupply;
//       userWallet.save((err, userWallet) => {
//         if (err) {
//           return logger.error('[tokenHoldersChecker] Save user wallet', err);
//         }
//         done(null, userWallet);
//       })
//     } else {
//       logger.warn('[tokenHoldersChecker] Unknown status', userWallet.ethWalletAddress, response.statusCode);
//       return done(null);
//     }
//   });
// }

// const startTokenHoldersChecker = () => {
//   setTimeout(() => {
//     logger.debug('[tokenHoldersChecker] start');
//     tokenHoldersChecker();
//   }, config.etherscan.intervalCheck * 1000);
// };
// startTokenHoldersChecker();




// /**
//  * Checks if the given string is an address
//  *
//  * @method isAddress
//  * @param {String} address the given HEX adress
//  * @return {Boolean}
// */
// var isAddress = function (address) {
//   if (address && !address.startsWith('0x')){
//     return false;
//   }
//   if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
//       // check if it has the basic requirements of an address
//       return false;
//   } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
//       // If it's all small caps or all all caps, return true
//       return true;
//   } else {
//       // Otherwise check each case
//       return isChecksumAddress(address);
//   }
// };

// /**
//  * Checks if the given string is a checksummed address
//  *
//  * @method isChecksumAddress
//  * @param {String} address the given HEX adress
//  * @return {Boolean}
// */
// var sha3 = require('./sha3.js');
// var isChecksumAddress = function (address) {
//   // Check each case
//   address = address.replace('0x','');
//   var addressHash = sha3(address.toLowerCase());

//   for (var i = 0; i < 40; i++ ) {
//       // the nth letter should be uppercase if the nth digit of casemap is 1
//       if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
//           return false;
//       }
//   }
//   return true;
// };



// web3 = new Web3(new Web3.providers.HttpProvider(config.cryptoPrice.web3URL));

// const getWeb3TokenBalance = (userWallet, contracts, done) => {
//   let tokensOwned = 0;
//   async.each(contracts, (contractAddr, contractDone) => {
//     // logger.debug('[tokenHoldersChecker] Checking user: ', userWallet.ethWalletAddress);
//     if (userWallet.ethWalletAddress && !isAddress(userWallet.ethWalletAddress)){
//       logger.debug('[tokenHoldersChecker] ETH address is not valid. ignoring... ', userWallet.ethWalletAddress, userWallet.user.toString());
//       return contractDone(null);
//     }

//     if (contractAddr === 'SALE CLOSED'){
//       done(null);
//       logger.debug('SALE CLOSED from User wallet update');
//       return;
//     }
    
//     // Get the address ready for the call, substring removes the '0x', as its not required
//     var tknAddress = (userWallet.ethWalletAddress).substring(2);
//     // '0x70a08231' is the contract 'balanceOf()' ERC20 token function in hex. A zero buffer is required and then we add the previously defined address with tokens
//     var contractData = ('0x70a08231000000000000000000000000' + tknAddress);
//     // Now we call the token contract with the variables from above, response will be a big number string 
//     try {
//       web3.eth.call({
//         to: contractAddr, // Contract address, used call the token balance of the address in question
//         data: contractData // Combination of contractData and tknAddress, required to call the balance of an address 
//       }, (err, result) => {
        
//       if (result) { 
//         var tokens = web3.utils.toBN(result).toString(); // Convert the result to a usable number string
//         // console.log('Tokens Owned: ' + ; // Change the string to be in Ether not Wei, and show it in the console
//         // if (tokensOwned > 0){
//         //   logger.debug('[tokenHoldersChecker] Success ', userWallet.ethWalletAddress, tokensOwned);
//         // }
//         tokensOwned += parseFloat(web3.utils.fromWei(tokens, 'ether'));

//         // web3.utils.fromWei(tokens, 'ether'))
//         contractDone(null);
//       }
//       else {
//         logger.debug('[tokenHoldersChecker] ERROR ', err, contractAddr, userWallet.ethWalletAddress, tokensOwned);
//         contractDone(null);
//       }
//     });
//    } catch (err) {
//     logger.error('[tokenHoldersChecker] Exception', err, contractAddr, userWallet.ethWalletAddress);
//     contractDone(null);
//    }
//   }, (err) => {
//     userWallet.tokens = tokensOwned;
//     userWallet.save((err, userWallet) => {
//       if (err) {
//         return logger.error('[tokenHoldersChecker] Save user wallet', err);
//       }
//       done(null, userWallet);
//     })
//   });
// }
