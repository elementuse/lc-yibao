import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeilongjiangSettingComponent } from '@app/yibao/setting/heilongjiang/heilongjiang-setting.component';
import { JingdezhenSettingComponent } from '@app/yibao/setting/jingdezhen/jingdezhen-setting.component';
import { ShenzhenSettingComponent } from '@app/yibao/setting/shenzhen/shenzhen-setting.component';
import { QingdaoSettingComponent } from '@app/yibao/setting/qingdao/qingdao-setting.component';
import { LongyanSettingComponent } from '@app/yibao/setting/longyan/longyan-setting.component';
import { FujianfuzhouSettingComponent } from '@app/yibao/setting/fujianfuzhou/fujianfuzhou-setting.component';
import { ChangxingSettingComponent } from '@app/yibao/setting/changxing/changxing-setting.component';
import { TaikangKq2SettingComponent } from '@app/yibao/setting/taikangkq2/taikangkq2-setting.component';
import { TaizhouSettingComponent } from '@app/yibao/setting/taizhou/taizhou-setting.component';

const routes: Routes = [
    {
        path: '',
        children: [
            { path: 'Heilongjiang', component: HeilongjiangSettingComponent},
            { path: 'Jingdezhen', component:JingdezhenSettingComponent},
            { path: 'ShenzhenYibao', component: ShenzhenSettingComponent},
            { path: 'Qingdao', component: QingdaoSettingComponent },
            { path: 'Longyan', component: LongyanSettingComponent },
            { path: 'Fujianfuzhou', component: FujianfuzhouSettingComponent },
            { path: 'Changxing', component: ChangxingSettingComponent },
            { path: 'TaikangKq2', component: TaikangKq2SettingComponent },
            { path: 'Taizhou', component: TaizhouSettingComponent}
        ]
    }
];

@NgModule({
    imports: [CommonModule, RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SettingRoutingModule { }
