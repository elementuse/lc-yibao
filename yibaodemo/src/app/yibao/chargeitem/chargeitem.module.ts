import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharegeItemRoutingModule } from '@app/yibao/chargeitem/chargeitem-routing.module';
import { ChargeitemComponent } from '@app/yibao/chargeitem/chargeitem.component';
import { RegisterItemComponent } from '@app/yibao/chargeitem/register-item-modal.component';
import { CreateItemComponent } from '@app/yibao/chargeitem/create-item-modal.component';
import { ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { JingdezhenImportModalComponent } from '@app/yibao/chargeitem/jingdezhen/jingdezhen-importmodal.component';
import { HangzhouImportModalComponent } from '@app/yibao/chargeitem/hangzhou/hangzhou-importmodal.component';
import { ChangxingImportModalComponent } from '@app/yibao/chargeitem/changxing/changxing-importmodal.component';
import { CalendarModule } from 'primeng/calendar';
import { ProgressBarModule } from 'primeng/progressbar';
import { ImportErrorModalComponent } from './importError/import-error-modal.component';
import { TaizhouImportModalComponent } from '@app/yibao/chargeitem/taizhou/taizhou-importmodal.component';

@NgModule({
    declarations: [
        ChargeitemComponent,
        RegisterItemComponent,
        CreateItemComponent,
        JingdezhenImportModalComponent,
        HangzhouImportModalComponent,
        ChangxingImportModalComponent,
        TaizhouImportModalComponent,
        ImportErrorModalComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        UtilsModule,
        TableModule,
        PaginatorModule,
        CharegeItemRoutingModule,
        ModalModule.forRoot(),
        CalendarModule,
        ProgressBarModule
    ],
    exports: [],
    providers: [],
})
export class ChargeItemModule { }