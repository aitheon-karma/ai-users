import { Component, OnInit , Input } from '@angular/core';
import { DomSanitizer,SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'fl-video-carousal',
  templateUrl: './video-carousal.component.html',
  styleUrls: ['./video-carousal.component.scss']
})
export class VideoCarousalComponent implements OnInit {
  
  @Input() videoUrls: Array<String>;
  @Input() startIndex = 0;

  currentVideoIndex = -1;

  constructor( public sanitizer: DomSanitizer,) { }

  ngOnInit() {
    if (this.startIndex < 0 || this.startIndex >= this.videoUrls.length) {
      this.startIndex = 0;
    }
    this.currentVideoIndex = this.startIndex;
  }

  showPreviousVideo() {
    if (this.currentVideoIndex == 0) {
      this.currentVideoIndex = this.videoUrls.length - 1;
    }
    else {
      this.currentVideoIndex--;
    }
  }

  showNextVideo() {
    if (this.currentVideoIndex == this.videoUrls.length - 1) {
      this.currentVideoIndex = 0;
    }
    else {
      this.currentVideoIndex++;
    }
  }

}
