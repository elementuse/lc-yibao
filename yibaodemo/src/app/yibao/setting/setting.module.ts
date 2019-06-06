import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingRoutingModule } from '@app/yibao/setting/setting-routing.module';
import { HeilongjiangSettingComponent } from '@app/yibao/setting/heilongjiang/heilongjiang-setting.component';
import { JingdezhenSettingComponent } from '@app/yibao/setting/jingdezhen/jingdezhen-setting.component';
import { ShenzhenSettingComponent } from '@app/yibao/setting/shenzhen/shenzhen-setting.component';
import { TabsModule, ModalModule } from 'ngx-bootstrap';
import { DeclarationModalComponent } from '@app/yibao/setting/heilongjiang/declaration-modal.component';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { QingdaoSettingComponent } from '@app/yibao/setting/qingdao/qingdao-setting.component';
import { LongyanSettingComponent } from '@app/yibao/setting/longyan/longyan-setting.component';
import { FujianfuzhouSettingComponent } from '@app/yibao/setting/fujianfuzhou/fujianfuzhou-setting.component';
import { ChangxingSettingComponent } from '@app/yibao/setting/changxing/changxing-setting.component';
import { TaikangKq2SettingComponent } from '@app/yibao/setting/taikangkq2/taikangkq2-setting.component';
import { TaizhouSettingComponent } from '@app/yibao/setting/taizhou/taizhou-setting.component';

@NgModule({
    declarations: [
        HeilongjiangSettingComponent,
        DeclarationModalComponent,
        JingdezhenSettingComponent,
        ShenzhenSettingComponent,
        QingdaoSettingComponent,
        LongyanSettingComponent,
        FujianfuzhouSettingComponent,
        ChangxingSettingComponent,
        TaikangKq2SettingComponent,
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
