import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcessComponent } from './process.component';
import { ProcessHeilongjiangComponent } from './heilongjiang/process-heilongjiang.component'
import { RefundHeilongjiangComponent } from './heilongjiang/refund-heilongjiang.component';
import { ProcessJingdezhenComponent } from './jingdezhen/process-jingdezhen.component';
import { RefundJingdezhenComponent } from './jingdezhen/refund-jingdezhen.component';
import { ProcessLongyanComponent } from './longyan/process-longyan.component';
import { ProcessFujianfuzhouComponent } from './fujianfuzhou/process-fujianfuzhou.component';
import { RefundLongyanComponent } from './longyan/refund-longyan.component';
import { RefundFujianfuzhouComponent } from './fujianfuzhou/refund-fujianfuzhou.component';
import { TokenLoginComponent } from './shared/tokenlogin/tokenlogin.component';
import { HeilongjiangSettingComponent } from './heilongjiang/setting/heilongjiang-setting.component';
import { ProcessShenzhenComponent } from './shenzhen/process-shenzhen.component';
import { RefundShenzhenComponent } from './shenzhen/refund-shenzhen.component';
import { ProcessQingdaoComponent } from './qingdao/process-qingdao.component';
import { RefundQingdaoComponent } from './qingdao/refund-qingdao.component';
import { PrintHeilongjiangComponent } from './heilongjiang/print/print-heilongjiang.component';
import { ProcessXinzhouComponent } from './xinzhou/process-xinzhou.component';
import { RefundXinzhouComponent } from './xinzhou/refund-xinzhou.component';
import { ProcessTestComponent } from './test/process-test.component';
import { RefundTestComponent } from './test/refund-test.component';
import { ProcessHangzhouComponent } from './hangzhou/process-hangzhou.component';
import { SelectChannelComponent } from './select/select-channel.component';
import { ProcessChangxingComponent } from './changxing/process-changxing.component';
import { ProcessTaikangKq2Component } from './taikangkq2/process-taikangkq2.component';
import { RefundTaikangKq2Component } from './taikangkq2/refund-taikangkq2.component';
import { RefundChangxingComponent } from './changxing/refund-changxing.component';
import { RefundHangzhouComponent } from './hangzhou/refund-hangzhou.component';
import { ProcessNingboComponent } from './ningbo/process-ningbo.component';
import { RefundNingboComponent } from './ningbo/refund-ningbo.component';
import { ProcessTaizhouComponent } from './taizhou/process-taizhou.component';
import { RefundTaizhouComponent } from './taizhou/refund-taizhou.component';

const routes: Routes = [
    {
        path: '', component: ProcessComponent,
        children: [
            { path: 'Heilongjiang', component: ProcessHeilongjiangComponent },
            { path: 'heilongjiang_setting', component: HeilongjiangSettingComponent },
            { path: 'heilongjiang_print', component: PrintHeilongjiangComponent },
            { path: 'Jingdezhen', component: ProcessJingdezhenComponent },
            { path: 'Longyan', component: ProcessLongyanComponent },
            { path: 'Fujianfuzhou', component: ProcessFujianfuzhouComponent },
            { path: 'ShenzhenYibao', component: ProcessShenzhenComponent },
            { path: 'Qingdao', component: ProcessQingdaoComponent },
            { path: 'Xinzhou', component: ProcessXinzhouComponent},
            { path: 'Hangzhou', component: ProcessHangzhouComponent},
            { path: 'Changxing', component: ProcessChangxingComponent},
            { path: 'tokenlogin', component: TokenLoginComponent },
            { path: 'Test', component: ProcessTestComponent },
            { path: 'Select', component: SelectChannelComponent },
            { path: 'TaikangKq2', component: ProcessTaikangKq2Component },
            { path: 'Ningbo', component: ProcessNingboComponent },
            { path: 'Taizhou', component: ProcessTaizhouComponent }
        ]
    },
    {
        path: 'refund', component: ProcessComponent,
        children: [
            { path: 'Heilongjiang', component: RefundHeilongjiangComponent },
            // { path: 'heilongjiang_setting', component: HeilongjiangSettingComponent },
            { path: 'Jingdezhen', component: RefundJingdezhenComponent },
            { path: 'ShenzhenYibao', component: RefundShenzhenComponent },
            { path: 'Qingdao', component: RefundQingdaoComponent },
            { path: 'Longyan', component: RefundLongyanComponent },
            { path: 'Fujianfuzhou', component: RefundFujianfuzhouComponent },
            { path: 'Xinzhou', component: RefundXinzhouComponent },
            { path: 'Hangzhou', component: RefundHangzhouComponent },
            { path: 'Changxing', component: RefundChangxingComponent },
            { path: 'TaikangKq2', component: RefundTaikangKq2Component },
            { path: 'Test', component: RefundTestComponent },
            { path: 'Ningbo', component: RefundNingboComponent },
            { path: 'Taizhou', component: RefundTaizhouComponent }
        ]
    },
    {
        path: '**', redirectTo: '/app/main/dashboard'
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProcessRoutingModule { }
