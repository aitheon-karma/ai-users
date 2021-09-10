import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'fl-image-carousal',
  templateUrl: './image-carousal.component.html',
  styleUrls: ['./image-carousal.component.scss']
})
export class ImageCarousalComponent implements OnInit {

  @Input() imageUrls: Array<String>;
  @Input() startIndex = 0

  currentImageIndex = -1;

  constructor() { }

  ngOnInit() {
    if (this.startIndex < 0 || this.startIndex >= this.imageUrls.length) {
      this.startIndex = 0;
    }
    this.currentImageIndex = this.startIndex;
  }

  getImages() {
    if (!this.imageUrls) {
      return [];
    }
    return this.imageUrls;
  }

  showPreviousImage() {
    if (this.currentImageIndex == 0) {
      this.currentImageIndex = this.getImages().length - 1;
    }
    else {
      this.currentImageIndex--;
    }
  }

  showNextImage() {
    if (this.currentImageIndex == this.getImages().length - 1) {
      this.currentImageIndex = 0;
    }
    else {
      this.currentImageIndex++;
    }
  }
}
