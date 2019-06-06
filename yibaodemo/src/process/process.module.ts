import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessComponent } from './process.component';
import { ProcessRoutingModule } from './process-routing.module';
import { FooterComponent } from './shared/layout/footer.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule, ModalModule} from 'ngx-bootstrap';
import { UtilsModule } from '@shared/utils/utils.module';
import { ProgressSpinnerModule } from 'primeng/primeng';
import { TokenService } from 'abp-ng2-module/dist/src/auth/token.service';
import { TokenLoginComponent } from './shared/tokenlogin/tokenlogin.component';
import { YibaoServiceModule } from '@app/yibao/yibao-service.module';
import { ProcessServiceModule } from './process-service.module';
import { NgZorroAntdModule, NZ_I18N, zh_CN } from 'ng-zorro-antd';
import { SelectChannelComponent } from './select/select-channel.component';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ProcessTaizhouComponent } from './taizhou/process-taizhou.component';
import { RefundTaizhouComponent } from './taizhou/refund-taizhou.component';
import { AdviceTaizhouComponent } from './taizhou/advice-taizhou.component';

@NgModule({
    declarations: [
        ProcessComponent,
        FooterComponent,
        TokenLoginComponent,
        SelectChannelComponent,
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
