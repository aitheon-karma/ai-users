/**
 * Core config for all micro services
 */
module.exports = {
  web: {
    title: 'Aitheon'
  },
  /**
   * SSL setting, to use http or https for links
   */
  secure: process.env.SECURE || false,
  /**
   * Domain used for cookies and etc.
   */
  domain: process.env.DOMAIN || 'aitheon.io',
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  /**
   * Logger setting
   */
  log: {
    // TODO: addd logger for all and change this config
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      level: 'debug',
      directoryPath: process.env.LOG_DIR_PATH || (process.cwd() + '/logs/'),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 5,
      json: false
    }
  },
  /**
   * Send mail config
   */
  mailer: {
    host: 'ai-mail.ai-mail.svc.cluster.local',
    port: '25',
    from: process.env.MAILER_FROM || '"Aitheon" <no-reply@aitheon.com>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  authURI: `http://ai-auth.ai-auth.svc.cluster.local:${ process.env.AI_AUTH_SERVICE_PORT || 3000 }`,
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