import { browser, element, by } from 'protractor';

export class FedoralabsUsersPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('fl-root h1')).getText();
  }
}
