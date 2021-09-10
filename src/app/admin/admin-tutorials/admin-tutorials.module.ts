import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminTutorialsRoutingModule } from './admin-tutorials-routing.module';
import { AdminTutorialsMediaComponent } from './admin-tutorials-media/admin-tutorials-media.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AdminTutorialsMediaComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CoreClientModule,
    SharedModule,
    AdminTutorialsRoutingModule
  ]
})
export class AdminTutorialsModule { }
