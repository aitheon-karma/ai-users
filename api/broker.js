const moleculer = require("moleculer");
const path = require('path');
const config = require(path.resolve('./config'));

// Create a ServiceBroker
const instance = new moleculer.ServiceBroker({
  transporter: {
    type: 'AMQP',
    options: {
      url: config.rabbitmq.uri,
      prefetch: 1,
      socketOptions: {
        servername: process.env.RABBIT_SERVER_NAME
      },
      autoDeleteQueues: 24 * 60 * 60 * 1000, // one day
    },
  },
  disableBalancer: true,
  logLevel: 'error'
});
exports.instance = instance;

// todo: Define a service later
// broker.createService({
//     name: `${ config.serviceId }.UsersService`,
//     events: {
//        funcitnoName: // function from requried
//     }
// });

// Start the broker

exports.start = () => {
  instance.start();
}

// debug
// setTimeout(() => {
//   const user = {
//     _id: '5925fbf039f56f0016d370cd',
//     email: 'test@rwerw.com',
//     profile: {
//       firstName: 'ests',
//       lastName: 'Archsetestser'
//     }
//   }
//   instance.emit(`GiteaService.createUser`, { user, password: 'password' }, [`CREATORS_STUDIO${config.environment === 'production' ? '' : '_DEV'}`])
// }, 10000)
