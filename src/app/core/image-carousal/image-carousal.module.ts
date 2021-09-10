import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCarousalComponent } from './image-carousal.component';
import { CoreClientModule } from '@aitheon/core-client';

@NgModule({
  declarations: [ImageCarousalComponent],
  imports: [
    CommonModule,
    CoreClientModule
  ],
  providers: [],
  exports: [
    ImageCarousalComponent
  ]
})
export class ImageCarousalModule { }
