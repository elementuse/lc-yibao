import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YibaoRoutingModule } from '@app/yibao/yibao-routing.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, EditorModule, InputMaskModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'ng2-select';
import { SettingModule } from '@app/yibao/setting/setting.module';
import { CheckModule } from '@app/yibao/check/check.module';
import { TabsModule, ModalModule } from 'ngx-bootstrap';
import { ProcessListComponent } from '@app/yibao/processlist/processlist.component';
import { YibaoServiceModule } from '@app/yibao/yibao-service.module';

@NgModule({
  imports: [
    CommonModule,
    YibaoRoutingModule,
    UtilsModule,
    FormsModule,
    TableModule,
    PaginatorModule,
    AutoCompleteModule,
    EditorModule,
    InputMaskModule,
    SelectModule,
    SettingModule,
    CheckModule,
    ModalModule.forRoot(),
    TabsModule.forRoot(),
    YibaoServiceModule
  ],
  declarations: [
    ProcessListComponent
  ],
  providers: [
    DatePipe
  ]
})
export class YibaoModule { }
