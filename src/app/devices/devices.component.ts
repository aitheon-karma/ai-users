import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { DevicesService, Device } from './shared';
import { ToastrService } from 'ngx-toastr';
import { Organization } from '../organizations/shared';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DeviceAccess } from './shared/device-access';
import { CompleterItem, CompleterCmp, CompleterData, CompleterService } from 'ng2-completer';
import { AuthService } from '@aitheon/core-client';

@Component({
  selector: 'fl-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit {

  @ViewChild('deviceModal') public deviceModal: ModalDirective;
  @Input('organization') organization: Organization;
  @ViewChild('userSearch') userSearch: CompleterCmp;

  dataRemote: CompleterData;
  loading = false;
  devices: Array<Device>;
  deviceAccesses: Array<DeviceAccess>;
  selectedDevice: Device;
  loadingAccess = false;
  emailInvalid = false;
  emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  constructor(
    private devicesService: DevicesService,
    private toastr: ToastrService,
    private authService: AuthService,
    private completerService: CompleterService
  ) {
    this.dataRemote = completerService.remote(
      `/users/api/users/profile/search?onlyOrg=true&search=`,
      'email,profile.firstName,profile.lastName',
      'email');
  }

  ngOnInit() {
    this.loading = true;
    const deviceManagerIsOn = (this.organization.services as []).findIndex((s: any) => {
      return (s === 'DEVICE_MANAGER') || (s.service && s.service === 'DEVICE_MANAGER');
    }) > -1;
    if (deviceManagerIsOn) {
      this.devicesService.list().subscribe((devices: Array<Device>) => {
        this.devices = devices;
        this.loading = false;
      }, (err: any) => {
        this.loading = false;
        this.toastr.error(err);
      });
    }
  }

  showAccess(device: Device) {
    this.selectedDevice = device;
    this.userSearch.writeValue('');
    this.deviceModal.show();
    this.loadingAccess = true;
    this.devicesService.deviceAccesses(this.selectedDevice._id).subscribe((deviceAccesses: Array<DeviceAccess>) => {
      this.deviceAccesses = deviceAccesses;
      this.loadingAccess = false;
    }, (err: any) => {
      this.loadingAccess = false;
      this.toastr.error(err);
    });
  }

  saveAccess(deviceAccess: DeviceAccess) {
    deviceAccess.savingAccess = true;
    this.devicesService.saveDeviceAccesses(this.selectedDevice._id, deviceAccess).subscribe((access: DeviceAccess) => {
      deviceAccess._id = access._id;
      deviceAccess.savingAccess = false;
      deviceAccess.editMode = false;
    }, (err: any) => {
      deviceAccess.savingAccess = false;
      deviceAccess.editMode = false;
      this.toastr.error(err);
    });
  }

  removeAccess(deviceAccess: DeviceAccess) {
    const index = this.deviceAccesses.findIndex((d: DeviceAccess) => d.user._id === deviceAccess.user._id );
    deviceAccess.savingAccess = true;
    this.devicesService.removeDeviceAccesses(this.selectedDevice._id, deviceAccess._id).subscribe(() => {
      if (index > -1) {
        this.deviceAccesses.splice(index, 1);
      }
      deviceAccess.savingAccess = false;
    }, (err: any) => {
      deviceAccess.savingAccess = false;
      this.toastr.error(err);
    });
  }

  onUserSelected(selected: CompleterItem) {

    if (selected) {
      const index = this.deviceAccesses.findIndex((s: any) => s.user._id === selected.originalObject._id);
      if (index === -1) {
        this.deviceAccesses.push({ user: selected.originalObject._id, accessLevel: 'USER', editMode: true });
      }
      // const index = this.shareList.findIndex((s: any) => { return s._id === selected.originalObject._id; });
      // if (index === -1){
      //   selected.originalObject.organization = '';
      //   this.shareList.push(selected.originalObject)
      // }
    }
  }

  onSearchKeydown(event: any) {
    this.emailInvalid = false;
    if (event.keyCode === 13) {
      const email = this.userSearch.value;
      if (!this.emailRegex.test(email)) {
        this.emailInvalid = true;
        return;
      }
      const index = this.deviceAccesses.findIndex((s: any) => s.user.email === email.toLowerCase());
      if (index === -1) {
        const user = { email : email } as any;
        // this.deviceAccesses.push({ user: user, accessLevel: 'USER' });
        this.userSearch.writeValue('');
        this.userSearch.blur();
        this.userSearch.open();
      }
    }
  }

  editAccess(deviceAccess: DeviceAccess) {
    deviceAccess.editMode = true;
  }

}
