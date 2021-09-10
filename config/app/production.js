/**
 * App relative config. Can override any core config
 */
module.exports = {
  /**
   * Identify itself. Current MicroService Name and ID in Database
   */
  serviceId: 'USERS',
  /**
   * App running port
   */
  port: process.env.PORT || 3000,
  /**
   * App environment
   */
  environment: process.env.NODE_ENV || 'production',
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
  upwork: {
    secret : "6224f7aef2a4fea4",
    key : "09d42eec50c293e562ed6672b2cf3101",
  },
  KYC: {
    url: 'https://api.complyadvantage.com',
    apiKey: 'bp07zmOcWSxjAe8B3nxm4GDgnOT0SwAf',
    failedCheckInterval: 300, // seconds
    documentPassword: process.env.KYC_DOCUMENT_PASSWORD || 'yHh8aNhhdShJKM99FwQDKf5Nq'
  },
  cryptoPrice: {
    syncInterval: process.env.CRYPTO_PRICE_INTERVAL || 5, // seconds
    apiUrl: 'https://min-api.cryptocompare.com',
    web3URL: process.env.WEB3_URL || 'https://mainnet.infura.io/TSyakl4wJlsZT4Y1Vkzt'
  },
  etherscan: {
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY ||'4TXJ86XCKIURDQBAF4PFRXR93PFVEIZ4SJ',
    intervalCheck:  process.env.ETHERSCAN_PRICE_INTERVAL || 120, //seconds
    checkerLimit:  process.env.ETHERSCAN_CHECKER_LIMIT || 300 // wallets counts
  },
  coinpayments: {
    key: process.env.COINPAYMENTS_KEY || 'e82c0b43f110237d837429fb85c1a488bbf982ff2d98eeecbf2eb127e2d085c5',
    secret: process.env.COINPAYMENTS_SECRET || '41CcFBCa051aebB6ec0814BfD9BB67E01e19412C094aa5D8b4cf1aAdDeC50be5',
    notificationUrl: process.env.COINPAYMENTS_EVENT_URL || '',
    IPNSecret: process.env.COINPAYMENTS_IPN_SECRET || 'test123',
    merchantId: process.env.COINPAYMENTS_MERCHANT_ID || '6e78bd94f6245f8816f5193d7a8795e3',
    maxPending: process.env.COINPAYMENTS_MAX_PENDING || 3
  },
  /**
   * TelegramBot
   */
  telegram: {
    botToken: process.env.TELEGRAM_TOKEN || '',
    botUrl: process.env.TELEGRAM_URL || 'https://t.me/aitheon_bot',
    pooling: process.env.TELEGRAM_POOLING || true,
    groupId: process.env.TELEGRAM_GROUP || '@aitheon',
    timeoutCheck: process.env.TELEGRAM_TIMEOUT_CHECK || 10 * 60 * 1000
  },
  unsubscribedEmailSecret: 'sJDxDuKuZsMy9EEATK',
  captchaKey: '6LfPi04UAAAAAEama_HcSU4K_SZAtC1lA2hAkZcL',
  verifyEmailSecret: '6ZrLSQBs3aWqN5z6',
  driveURI: `http://ai-drive.ai-drive.svc.cluster.local:${ process.env.AI_DRIVE_SERVICE_PORT || 3000 }`,
  taskURI: `https://${process.env.DOMAIN}/orchestrator`,
  contactURI : `https://${process.env.DOMAIN}/contacts`,
  creatorsStudioURI : `https://${process.env.DOMAIN}/creators-studio`,
  accountingURI: `https://${process.env.DOMAIN}/accounting`,
  /**
   * Instagram
   */
  instagram: {
    auth_uri: process.env.INSTAGRAM_AUTH_URI || 'https://api.instagram.com/oauth/authorize/?',
    token_exchange_uri: process.env.INSTAGRAM_TOKEN_EXCHANGE_URI || 'https://api.instagram.com/oauth/access_token',
    recent_media_uri: process.env.INSTAGRAM_RECENT_MEDIA_URI || 'https://api.instagram.com/v1/users/self/media/recent/?access_token=',
    client_id: process.env.INSTAGRAM_CLIENT_ID || '771838ebf19147d3b69ed7dd446d4ff2',
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '4722889f3152405bab33c88d98fcc212',
    grant_type: process.env.INSTAGRAM_GRANT_TYPE || 'authorization_code'
  },
  youtube: {
    client_id: process.env.YOUTUBE_CLIENT_ID || '1070202272441-v6kuisq7uug0f7rf624pnl6fmi8s53aa.apps.googleusercontent.com',
    client_secret_id: process.env.YOUTUBE_CLIENT_SECRET_ID || 'iltvsYxqs9a1_smUMA12PhSg',
  },
  /**
   * Flickr
   * https://www.flickr.com/services/api/
   */
  flickr: {
    // get token key and secret
    request_token: 'https://www.flickr.com/services/oauth/request_token',
    // get oauth_token
    auth_token: 'https://www.flickr.com/services/oauth/authorize?',
    // get access token with auth token
    access_token: 'https://www.flickr.com/services/oauth/access_token',
    // test login for user id
    flickr_api: 'https://api.flickr.com/services/rest/?method=flickr.test.login&format=json&nojsoncallback=1',
    //get feed images with user id
    get_images: 'https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1',
    // api key
    oauth_consumer_key: '955dd9ca24469e72ae5e0fb047eb904b',
    // secret key
    client_secret: '50b90f14da33dea6',
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@ai-rabbitmq.ai-rabbitmq.svc.cluster.local:5672`
  },
  webPush: {
    PUBLIC_VAPID: 'BLJMSdIHgjB4s8Y7Oq8yJ8AAgOBdgcZQh-GGdx_VnV-hVgROlTK-isz6yWGxMFVQRcXp__bb6kRLXT8mTk2MJqU',
    PRIVATE_VAPID: 'dZt_8iSnQ6cDBFx_3i9fVTrIyT5grrYIVKuoKxjNHco'
  },
  pipedrive: {
    host: 'aitheon.pipedrive.com',
    PIPEDRIVE_API_KEY: process.env.PIPEDRIVE_API_KEY
  },
  /**
   * Google Map Key
   */
  googleMapKey: 'AIzaSyB_ZvlX7m7YRan99TyJ1qmy_VPQjN1dcOI'
}
