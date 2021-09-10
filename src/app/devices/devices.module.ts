import { NgModule } from '@angular/core';
import { DevicesComponent } from './devices.component';
import { CoreClientModule } from '@aitheon/core-client';
import { ModalModule } from 'ngx-bootstrap/modal';
import { DevicesService } from './shared';
import { Ng2CompleterModule } from 'ng2-completer';

@NgModule({
  imports: [
    CoreClientModule,
    ModalModule,
    Ng2CompleterModule
  ],
  declarations: [DevicesComponent],
  providers: [DevicesService],
  exports: [DevicesComponent]
})
export class DevicesModule { }
