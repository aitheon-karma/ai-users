import { Component, OnInit } from '@angular/core';
import { UsersService } from '../shared';

@Component({
  selector: 'ai-user-statistics',
  templateUrl: './user-statistics.component.html',
  styleUrls: ['./user-statistics.component.scss']
})
export class UserStatisticsComponent implements OnInit {
  userActivities: any[] = [];
  loading: boolean = false;

  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.getUserActivities();
  }

  getUserActivities() {
    this.loading = true;
    this.usersService.getUserActivities().subscribe(res => {
      this.userActivities = res;
      this.loading = false;
    })
  }

}
