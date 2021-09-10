import { FedoralabsUsersPage } from './app.po';

describe('fedoralabs-users App', () => {
  let page: FedoralabsUsersPage;

  beforeEach(() => {
    page = new FedoralabsUsersPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('fl works!');
  });
});
