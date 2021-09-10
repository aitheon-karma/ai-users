import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCarousalComponent } from './video-carousal.component';

@NgModule({
  declarations: [VideoCarousalComponent],
  imports: [
    CommonModule
  ],
  providers: [],
  exports: [
    VideoCarousalComponent
  ]
})
export class VideoCarousalModule { }
