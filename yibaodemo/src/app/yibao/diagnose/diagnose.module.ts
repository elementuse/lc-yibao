import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnoseRoutingModule } from '@app/yibao/diagnose/diagnose-routing.module';
import { DiagnoseComponent } from '@app/yibao/diagnose/diagnose.component';
import { RegisterDiagnoseComponent } from '@app/yibao/diagnose/register-diagnose-modal.component';
import { CreateDiagnoseComponent } from '@app/yibao/diagnose/create-diagnose-modal.component';
import { ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { ShenzhenImportDiagnoseComponent } from '@app/yibao/diagnose/shenzhen/shenzhen-importdiagnose.component';
import { CalendarModule } from 'primeng/calendar';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChangxingImportDiagnoseComponent } from '@app/yibao/diagnose/changxing/changxing-importdiagnose.component';
import { HangzhouImportDiagnoseComponent } from '@app/yibao/diagnose/hangzhou/hangzhou-importdiagnose.component';
@NgModule({
    declarations: [
        DiagnoseComponent,
        RegisterDiagnoseComponent,
        CreateDiagnoseComponent,
        ShenzhenImportDiagnoseComponent,
        ChangxingImportDiagnoseComponent,
        HangzhouImportDiagnoseComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        UtilsModule,
        TableModule,
        PaginatorModule,
        DiagnoseRoutingModule,
        ModalModule.forRoot(),
        CalendarModule,
        ProgressBarModule
    ],
    exports: [],
    providers: [
    ],
})
export class DiagnoseModule { }