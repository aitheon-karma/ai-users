// This will be moved to db in the future
const WIDGETS = Object.freeze({

  // ORGANIZATION_STATS: {
  //   _id: 'ORGANIZATION_STATS',
  //   title: 'Organization Stats',
  //   description: 'See your organization information and stats',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'organization-stats',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }

  // },

  // CREATOR_STUDIO: {
  //   _id: 'CREATOR_STUDIO',
  //   title: 'Creator Studio',
  //   description: 'Develop your project in Creator Studio',
  //   previewImg: 'assets/img/widgets/creator-studio.png',
  //   component: 'creator-studio',
  //   config: {
  //     rows: 3,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },

  // PLATFORM_INTRODUCE: {
  //   _id: 'PLATFORM_INTRODUCE',
  //   title: 'Platform Introduce',
  //   description: 'Check out our platform',
  //   previewImg: 'assets/img/widgets/platform-introduce.png',
  //   component: 'platform-introduce',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },

  // MARKET: {
  //   _id: 'MARKET',
  //   title: 'Marketplace',
  //   description: 'Sell ​​your products in our market',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'market',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },


  MY_ORGANIZATION: {
    _id: 'MY_ORGANIZATION',
    title: 'My organization',
    description: 'Control your organization',
    previewImg: 'assets/img/widgets/my-organization.png',
    component: 'my-organization',
    config: {
      rows: 2,
      cols: 1,
      dragEnabled: true,
    }
  },

  // CREATE_PROJECT: {
  //   _id: 'CREATE_PROJECT',
  //   title: 'Create Project',
  //   description: 'Create a new Project',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'create-project',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },

  // RECENT_PROJECTS: {
  //   _id: 'RECENT_PROJECTS',
  //   title: 'Recent Projects',
  //   description: 'See you recent projects',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'recent-projects',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },

  // MARKETING: {
  //   _id: 'MARKETING',
  //   title: 'Marketing',
  //   description: 'Marketing information',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'marketing',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },

  // TUTORIAL: {
  //   _id: 'TUTORIAL',
  //   title: 'Tutorial',
  //   description: 'Tutorials/Documentation/Getting Started',
  //   previewImg: 'assets/img/widgets/sample.png',
  //   component: 'tutorial',
  //   config: {
  //     rows: 2,
  //     cols: 1,
  //     dragEnabled: true,
  //   }
  // },
  DEFAULT_WIDGETS: [
    {
        _id: 'TREASURY_ACCOUNTS',
        title: 'Treasury Accounts',
        description: 'See your treastury accounts balances and information',
        previewImg: 'assets/img/widgets/treasury.png',
        component: 'treasuryAccounts',
        config: {
          rows: 2,
          cols: 1,
          dragEnabled: true,
        }
      },
      // {
      //   _id: 'TREASURY_CRYPTO_ACCOUNTS',
      //   title: 'Treasury Eth Accounts',
      //   description: 'See your treastury accounts balances and information',
      //   previewImg: 'assets/img/widgets/treasury.png',
      //   component: 'treasuryCryptoAccounts',
      //   config: {
      //     rows: 3,
      //     cols: 1,
      //     dragEnabled: true,
      //   }
      // },
      // {
      //   _id: 'PROFILE_STATE',
      //   title: 'Profile State',
      //   description: 'See the state of your Profile',
      //   previewImg: 'assets/img/widgets/profile.png',
      //   component: 'profileState',
      //   config: {
      //     rows: 1,
      //     cols: 1,
      //     dragEnabled: true,
      //   }
      // },
      {
        _id: 'CREATE_ORGANIZATION',
        title: 'Create Organization',
        description: 'Create an organization',
        previewImg: 'assets/img/widgets/add-organization.png',
        component: 'create-organization',
        config: {
          rows: 1,
          cols: 1,
          dragEnabled: true,
        }
      },
  ],


  ALL_WIDGETS: () => {
  return [
    // WIDGETS.CREATE_PROJECT,
    // WIDGETS.ORGANIZATION_STATS,
    // WIDGETS.MARKETING,
    // WIDGETS.TUTORIAL,
    ...WIDGETS.DEFAULT_WIDGETS,
    // WIDGETS.RECENT_PROJECTS,
    // WIDGETS.CREATOR_STUDIO,
    // WIDGETS.PLATFORM_INTRODUCE,
    // WIDGETS.MARKET,
    // WIDGETS.MARKET_THING,
    WIDGETS.MY_ORGANIZATION,
  ]
  }
});

module.exports = WIDGETS;






