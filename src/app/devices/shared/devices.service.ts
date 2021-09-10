// tslint:disable-next-line:import-blacklist
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { Device } from './device';
import { DeviceAccess } from './device-access';
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class DevicesService {

  constructor(private restService: RestService) { }

  list(): Observable<Array<Device>> {
    return this.restService.fetch(`${ environment.baseApi }/device-manager/api/devices-access/user-assignable`, null, true);
  }

  deviceAccesses(deviceId: string) {
    return this.restService.fetch(`${ environment.baseApi }/device-manager/api/devices-access/${ deviceId }`, null, true);
  }

  saveDeviceAccesses(deviceId: string, deviceAccess: DeviceAccess): Observable<DeviceAccess> {
    return this.restService.post(`${ environment.baseApi }/device-manager/api/devices-access/${ deviceId }`, deviceAccess, true);
  }

  removeDeviceAccesses(deviceId: string, deviceAccessId: string): Observable<void> {
    // tslint:disable-next-line:max-line-length
    return this.restService.delete(`${ environment.baseApi }/device-manager/api/devices-access/${ deviceId }/${ deviceAccessId }`, true);
  }

}

