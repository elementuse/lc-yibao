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
import { CalendarModule } from 'primeng/calendar';
import { ProgressBarModule } from 'primeng/progressbar';
@NgModule({
    declarations: [
        DiagnoseComponent,
        RegisterDiagnoseComponent,
        CreateDiagnoseComponent
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