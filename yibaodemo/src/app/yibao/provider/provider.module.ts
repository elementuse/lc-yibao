import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderRoutingModule } from '@app/yibao/provider/provider-routing.module';
import { ProviderComponent } from '@app/yibao/provider/provider.component';
import { CreateProviderComponent } from '@app/yibao/provider/create-provider-modal.component';
import { RegisterProviderComponent } from '@app/yibao/provider/register-provider-modal.component';
import { ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';

@NgModule({
    declarations: [
        ProviderComponent,
        CreateProviderComponent,
        RegisterProviderComponent
    ],
    imports: [ 
        CommonModule,
        ProviderRoutingModule,
        FormsModule,
        UtilsModule,
        TableModule,
        PaginatorModule,
        ModalModule.forRoot(),
    ],
    exports: [],
    providers: [],
})
export class ProviderModule {}