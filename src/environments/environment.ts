// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  baseApi: 'https://dev.aitheon.com',
  driveUrl: '/drive',
  contactsUrl: '/contacts',
  treasuryUrl: '/treasury',
  creatorsStudioUrl: '/creators-studio',
  systemGraphUrl: '/system-graph',
  googleAnalyticsKey: 'UA-154946169-1',
  webPush: {
    VAPID_PUBLIC: 'BLJMSdIHgjB4s8Y7Oq8yJ8AAgOBdgcZQh-GGdx_VnV-hVgROlTK-isz6yWGxMFVQRcXp__bb6kRLXT8mTk2MJqU'
  }
};
