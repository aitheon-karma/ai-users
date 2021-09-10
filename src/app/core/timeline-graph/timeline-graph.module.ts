import { NgModule } from '@angular/core';
import { CoreClientModule } from '@aitheon/core-client';
import { TimelineGraphComponent } from './timeline-graph.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { SwiperModule } from 'ngx-swiper-wrapper';

@NgModule({
  imports: [
    CoreClientModule,
    PopoverModule.forRoot(),
    SwiperModule
  ],
  declarations: [TimelineGraphComponent],
  providers: [],
  exports: [
    TimelineGraphComponent
  ]
})

export class TimelineModule { }
