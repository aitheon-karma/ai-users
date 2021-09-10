import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { CoreClientModule } from '@aitheon/core-client';

@NgModule({
  declarations: [
    FileUploadComponent,
  ],
  imports: [
    CoreClientModule,
    CommonModule
  ],
  exports: [
    FileUploadComponent,
  ]
})
export class CoreModule { }
