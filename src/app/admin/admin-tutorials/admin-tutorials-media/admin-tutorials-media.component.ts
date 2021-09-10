import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { DriveUploaderComponent, AuthService } from '@aitheon/core-client';
import { MediaFile } from '../shared/media';
import { first } from 'rxjs/operators';
import { TutorialsService } from '../shared/tutorials.service';
import { TutorialSettings } from '../shared/tutorial-settings';

@Component({
  selector: 'ai-admin-tutorials-media',
  templateUrl: './admin-tutorials-media.component.html',
  styleUrls: ['./admin-tutorials-media.component.scss']
})
export class AdminTutorialsMediaComponent implements OnInit {

  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;

  submitted = false;
  loading = false;
  welcomeVidOpen = true;
  orgVidOpen = true;
  welcomeVideoFile: MediaFile;
  organizationVideoFile: MediaFile;
  imageLoading = false;
  serviceKey: any;
  allowedMimeType = [
    'video/*'
  ];
  activeOrganization: any;
  tutorialSettings: TutorialSettings;

  constructor(
    private authService: AuthService,
    private tutorialsService: TutorialsService,
  ) { }

  async ngOnInit() {
    this.activeOrganization = await this.authService.activeOrganization.pipe(first()).toPromise();
    this.tutorialSettings = await this.tutorialsService.listSettings().pipe(first()).toPromise();
    if (this.tutorialSettings) {
      this.organizationVideoFile = this.tutorialSettings.organizationVideo;
      this.welcomeVideoFile = this.tutorialSettings.welcomeVideo;
    }
    this.serviceKey = {
      _id: 'USER',
      key: `${this.activeOrganization._id}`
    };
  }

  onSuccessUpload(event: any, isOrganization: boolean) {
    const video = {
      _id: event._id,
      filename: event.name,
      mimetype: event.contentType,
      url: event.signedUrl,
      isOrganization: isOrganization
    } as MediaFile;
    this.imageLoading = true;
    this.createVideo(video);
  }

  createVideo(video: MediaFile) {
    this.tutorialsService.createVideo(video).subscribe(() => {
      if (video.isOrganization) {
        this.organizationVideoFile = video;
      } else {
        this.welcomeVideoFile = video;
      }
    });
  }

  toggleWelcomeVid() {
    this.welcomeVidOpen = !this.welcomeVidOpen;
  }

  toggleOrganizationVid() {
    this.orgVidOpen = !this.orgVidOpen;
  }

  openVid(type: any) {
    window.open(type, '_blank');
  }
}
