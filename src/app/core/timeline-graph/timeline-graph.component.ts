import { Component, OnInit, Input } from '@angular/core';
import AOS from 'aos';
import { Timeline, Timeline_Settings } from './shared/timeline.model';
import { SwiperConfigInterface, SwiperPaginationInterface } from 'ngx-swiper-wrapper';
@Component({
  selector: 'ai-timeline-graph',
  templateUrl: './timeline-graph.component.html',
  styleUrls: ['./timeline-graph.component.scss']
})


export class TimelineGraphComponent implements OnInit {
  @Input() TimelineData: Timeline[];
  @Input() Settings;
  timelineData: Timeline[] = [];
  timeline_Settings: Timeline_Settings;
  enableHorizontalView: boolean = false;
  isProfileView: boolean = false;
  pagination: SwiperPaginationInterface = {
    el: '.swiper-pagination',
    clickable: true,
    hideOnClick: false
  };

  config: SwiperConfigInterface = {
    a11y: true,
    direction: 'horizontal',
    slidesPerView: 1,
    keyboard: true,
    mousewheel: true,
    scrollbar: true,
    navigation: true,
    pagination: this.pagination
  };




  constructor() { }
  ngOnInit() {
    //intialize settings from component as input
    this.timeline_Settings = this.Settings;
    this.enableHorizontalView = this.timeline_Settings == null ? false : this.timeline_Settings.enableHorizontalView;
    this.isProfileView = this.timeline_Settings == null ? false : this.timeline_Settings.isProfileView;
    AOS.init({
      easing: 'ease-in-out-sine'
    });
    this.timelineData = this.TimelineData;
  }
}
