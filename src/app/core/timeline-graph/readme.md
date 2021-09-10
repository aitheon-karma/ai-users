
Follow these steps to configure timeline component

Step 1: Install ngx-swiper-wrapper for slider in timeline graph
npm install ngx-swiper-wrapper --save

Step 2: Install aos and refer the css file to enable animations
npm install aos --save
@import "../../node_modules/aos/dist/aos.css";
@import '../../node_modules/swiper/dist/css/swiper.min.css';

step 3: Import module in module.ts file 
import { TimelineModule } from '../timeline-graph/timeline-graph.module';

@NgModule({
  imports: [
    ..,
    TimelineModule,
    ..
  ],

step 4: Add module tag in the corresponding component html
<ai-timeline-graph [TimelineData]="timelineData" [Settings]="timeline_settings"></ai-timeline-graph>

step 5: Set data to the model for populating in the graph
timelineData = [{
    _id: "1",
    year: "2018",
    timelineQuarter: [
      {
        _id: "1",
        quarter: "Q1",
        quarterData: [{
          _id: "1",
          event: "Public Launch"
        },..
        ]
      },..

    ]
},..
];

step 6: Configure settings object to switch between horizontal and vertical view
timeline_settings = {enableHorizontalView : false};
