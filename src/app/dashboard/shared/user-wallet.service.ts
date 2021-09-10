/*import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';

import { UserWallet } from './user-wallet';
import { CryptoSettings } from './crypto-settings';

@Injectable()
export class UserWalletService {

  constructor(private restService: RestService) { }

  myWallet(): Observable<{ userWallet: UserWallet, cryptoSettings: CryptoSettings }> {
    return this.restService.fetch(`/api/user-wallet/me`);
  }

  save(userWallet: UserWallet): Observable<UserWallet> {
    return this.restService.post(`/api/user-wallet/me`, userWallet);
  }

}
*/
