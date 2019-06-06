import { Component, OnInit, Injector } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { SettingServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './jingdezhen-setting.component.html',
    animations: [appModuleAnimation()]
})
export class JingdezhenSettingComponent extends AppComponentBase implements OnInit {
    hospitalCode: string = '';
    saving: boolean = false;
    savingtext: string = '正在保存中...';
    key:string;
    suffix:string;
    constructor(
        injector: Injector,
        private appSessionService: AppSessionService,
        private yibaoservice: SettingServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.suffix = this.appSessionService.tenant ? 'Tenant' : 'Application';
        this.key = `Jingdezhen.HospitalCode.${this.suffix}`;
        this.hospitalCode = abp.setting.get(this.key);
     }

    save(): void {
        this.yibaoservice.setSetting(this.key,this.hospitalCode).subscribe(res =>{
            abp.setting.values[this.key] = this.hospitalCode;
            this.notify.info('保存成功');
        });
    }
}
