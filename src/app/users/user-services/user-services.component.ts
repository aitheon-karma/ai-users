import { Service, ServicesService } from './../../services/shared';
import { AuthService } from '@aitheon/core-client';
import { User } from './../shared/user';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fl-user-services',
  templateUrl: './user-services.component.html',
  styleUrls: ['./user-services.component.scss']
})
export class UserServicesComponent implements OnInit {

  currentUser: User;
  services: Service[];
  loading = false;

  constructor(private authService: AuthService, private servicesService: ServicesService) { }

  ngOnInit() {
    this.loading = true;
    this.servicesService.listPersonal().subscribe((response: any) => {
      this.authService.currentUser.subscribe((user: User) => {
        this.currentUser = user;
        this.services = response.filter((s: any) => !s.core);
        this.loading = false;
      });
    });
  }

  onServicesChanged(): void {
     this.authService.loadServices();
  }

}
