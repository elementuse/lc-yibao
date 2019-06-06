import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessComponent } from './process.component';
import { ProcessRoutingModule } from './process-routing.module';
import { FooterComponent } from './shared/layout/footer.component';
import { ProcessHeilongjiangComponent } from './heilongjiang/process-heilongjiang.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule, ModalModule} from 'ngx-bootstrap';
import { UtilsModule } from '@shared/utils/utils.module';
import { RefundHeilongjiangComponent } from './heilongjiang/refund-heilongjiang.component';
import { ProcessJingdezhenComponent } from './jingdezhen/process-jingdezhen.component';
import { ProcessLongyanComponent } from './longyan/process-longyan.component';
import { ProcessFujianfuzhouComponent } from './fujianfuzhou/process-fujianfuzhou.component';
import { RefundJingdezhenComponent } from './jingdezhen/refund-jingdezhen.component';
import { ProgressSpinnerModule } from 'primeng/primeng';
import { TokenService } from 'abp-ng2-module/dist/src/auth/token.service';
import { TokenLoginComponent } from './shared/tokenlogin/tokenlogin.component';
import { HeilongjiangSettingComponent } from './heilongjiang/setting/heilongjiang-setting.component';
import { DeclarationModalComponent } from './heilongjiang/setting/declaration-modal.component';
import { YibaoServiceModule } from '@app/yibao/yibao-service.module';
import { ProcessServiceModule } from './process-service.module';
import { ProcessShenzhenComponent } from './shenzhen/process-shenzhen.component';
import { RefundShenzhenComponent } from './shenzhen/refund-shenzhen.component';
import { AddAdviceComponent } from './shenzhen/addadvice-modal.component';
import { RefundLongyanComponent } from './longyan/refund-longyan.component';
import { RefundFujianfuzhouComponent } from './fujianfuzhou/refund-fujianfuzhou.component';
import { ProcessQingdaoComponent } from './qingdao/process-qingdao.component';
import { MedicineQingdaoComponent } from './qingdao/medicine-modal.component';
import { RefundQingdaoComponent } from './qingdao/refund-qingdao.component';
import { PrintHeilongjiangComponent } from './heilongjiang/print/print-heilongjiang.component';
import { ProcessXinzhouComponent } from './xinzhou/process-xinzhou.component';
import { RefundXinzhouComponent } from './xinzhou/refund-xinzhou.component';
import { RefundTestComponent } from './test/refund-test.component';
import { ProcessTestComponent } from './test/process-test.component';
import { NgZorroAntdModule, NZ_I18N, zh_CN } from 'ng-zorro-antd';
import { ProcessHangzhouComponent } from './hangzhou/process-hangzhou.component';
import { SelectChannelComponent } from './select/select-channel.component';
import { ProcessChangxingComponent } from './changxing/process-changxing.component';
import { ProcessTaikangKq2Component } from './taikangkq2/process-taikangkq2.component';
import { RefundTaikangKq2Component } from './taikangkq2/refund-taikangkq2.component';
import { RefundChangxingComponent } from './changxing/refund-changxing.component';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { AdviceHangzhouComponent } from './hangzhou/advice-hangzhou.component';
import { RefundHangzhouComponent } from './hangzhou/refund-hangzhou.component';
import { ProcessNingboComponent } from './ningbo/process-ningbo.component';
import { RefundNingboComponent } from './ningbo/refund-ningbo.component';
import { ProcessTaizhouComponent } from './taizhou/process-taizhou.component';
import { RefundTaizhouComponent } from './taizhou/refund-taizhou.component';
import { AdviceTaizhouComponent } from './taizhou/advice-taizhou.component';

@NgModule({
    declarations: [
        ProcessComponent,
        FooterComponent,
        ProcessHeilongjiangComponent,
        HeilongjiangSettingComponent,
        // HeilongjiangSettingComponent,
        DeclarationModalComponent,
        RefundHeilongjiangComponent,
        ProcessJingdezhenComponent,
        RefundJingdezhenComponent,
        ProcessLongyanComponent,
        RefundLongyanComponent,
        ProcessFujianfuzhouComponent,
        RefundFujianfuzhouComponent,
        ProcessShenzhenComponent,
        RefundShenzhenComponent,
        AddAdviceComponent,
        ProcessQingdaoComponent,
        MedicineQingdaoComponent,
        RefundQingdaoComponent,
        ProcessXinzhouComponent,
        RefundXinzhouComponent,
        ProcessHangzhouComponent,
        RefundHangzhouComponent,
        ProcessChangxingComponent,
        RefundChangxingComponent,
        TokenLoginComponent,
        PrintHeilongjiangComponent,
        ProcessTestComponent,
        RefundTestComponent,
        SelectChannelComponent,
        ProcessTaikangKq2Component,
        RefundTaikangKq2Component,
        AdviceHangzhouComponent,
        ProcessNingboComponent,
        RefundNingboComponent,
        ProcessTaizhouComponent,
        RefundTaizhouComponent,
        AdviceTaizhouComponent
    ],
    imports: [ 
        CommonModule,
        ProcessRoutingModule,
        FormsModule,
        TabsModule, 
        ModalModule,
        UtilsModule,
        ProgressSpinnerModule,
        YibaoServiceModule,
        ProcessServiceModule,
        NgZorroAntdModule,
        FileUploadModule,
        DialogModule
        // RouterModule
     ],
    exports: [],
    providers: [
        DatePipe,
        TokenService,
        { provide: NZ_I18N, useValue: zh_CN },
    ],
})
export class ProcessModule {

}
