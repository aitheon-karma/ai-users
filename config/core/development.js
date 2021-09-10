/**
 * Core config for all micro services
 */
module.exports = {
  web: {
    title: 'DEVELOPMENT - Aitheon'
  },
  /**
   * SSL setting, to use http or https for links
   */
  secure: process.env.SECURE || false,
  /**
   * Domain used for cookies and etc.
   */
  domain: process.env.DOMAIN || 'dev.aitheon.com',
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  /**
   * Logger Setting
   */
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    // https://github.com/winstonjs/winston
    // Winston logger options
    fileLogger: {
      level: 'silly',
      directoryPath: process.cwd() + '/logs/',
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  /**
   * Send mail config
   */
  mailer: {
    host: 'localhost',
    port: '2525',
    from: '"DEV Isabel - FedoraLabs" <no-reply@testingdomain.io>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  /**
   * Auth service url used to process user when running locally
   */
  authURI: `https://dev.aitheon.com/auth`,
  /**
   * AWS S3 Settings
   */
  aws_s3: {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIAJ4SOUDVXZNLMVWWA",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
    },
    bucket: process.env.AWS_SECRET_ACCESS_KEY || "isabel-data"
  },
    /**
   * Max String Limits
   */
  validators: {
    MAX_NAME_LENGTH: 140,
    MAX_DESCRIPTION_LENGTH: 800
  }
}
