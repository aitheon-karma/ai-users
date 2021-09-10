import { Component, OnInit, Input } from '@angular/core';
import { News, DashboardService, Settings } from 'app/dashboard/shared';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'fl-widget-feed',
  templateUrl: './widget-feed.component.html',
  styleUrls: ['./widget-feed.component.scss']
})
export class WidgetFeedComponent implements OnInit {
  welcomeEnabled: Boolean;
  welcomeHtml: String;
  
  news: News[];
  newsCount: Number;
  settings: Settings;
  totalNewsPages: Number;
  currentNewsPage: Number = 1;

  WelcomeViewState: Boolean;

  constructor(
    private toastr: ToastrService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    

    this.dashboardService.get().subscribe((s: Settings) => {
      this.welcomeEnabled = s.dashboard.showWelcome;
      this.WelcomeViewState = this.welcomeEnabled;
      this.welcomeHtml = s.dashboard.welcomeHtml;
    }, (err) => {
      this.toastr.error(err);
    });
    
    this.loadNews(1);
  }

  loadNews(page: Number) {
    this.dashboardService.getNews(page).subscribe((result: { count: Number, news: News[] }) => {
      this.news = result.news;
      this.newsCount = result.count;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  onPageChange(event: { page: number }) {
    this.currentNewsPage = event.page;
    this.loadNews(this.currentNewsPage);
  }

  onTotalPagesCount(totalPages: Number) {
    this.totalNewsPages = totalPages;
  }

}
