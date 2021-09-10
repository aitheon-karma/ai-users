import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoCarousalComponent } from './video-carousal.component';

describe('VideoCarousalComponent', () => {
  let component: VideoCarousalComponent;
  let fixture: ComponentFixture<VideoCarousalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoCarousalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoCarousalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
