import { ModalModule } from 'ngx-bootstrap/modal';
import { FileIconDirective } from './file-icon.directive';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { FilesComponent } from './files.component';
import { FilesService } from './shared';

@NgModule({
  imports: [
    CoreClientModule,
    SweetAlert2Module,
    ModalModule
  ],
  exports: [FilesComponent],
  declarations: [FilesComponent, FileIconDirective],
  providers: [FilesService]
})
export class FilesModule { }
