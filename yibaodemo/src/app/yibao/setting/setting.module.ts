import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingRoutingModule } from '@app/yibao/setting/setting-routing.module';
import { TabsModule, ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { TaizhouSettingComponent } from '@app/yibao/setting/taizhou/taizhou-setting.component';

@NgModule({
    declarations: [
        TaizhouSettingComponent
    ],
    imports: [ 
        CommonModule,
        SettingRoutingModule,
        FormsModule,
        UtilsModule,
        ModalModule.forRoot(),
        TabsModule.forRoot()
    ],
    exports: [],
    providers: [],
})
export class SettingModule {}
