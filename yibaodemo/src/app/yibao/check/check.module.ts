import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule, ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { CheckRoutingModule } from '@app/yibao/check/check-routing.module';
import { TaizhouCheckComponent } from '@app/yibao/check/taizhou/taizhou-check.component';

@NgModule({
    declarations: [
        TaizhouCheckComponent
    ],
    imports: [ 
        CommonModule,
        CheckRoutingModule,
        FormsModule,
        UtilsModule,
        CalendarModule,
        TableModule,
        PaginatorModule,
        ModalModule.forRoot(),
        TabsModule.forRoot()
    ],
    exports: [],
    providers: [],
})
export class CheckModule {}
