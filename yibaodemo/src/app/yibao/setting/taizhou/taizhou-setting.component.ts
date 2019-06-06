import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { SettingServiceProxy } from "@shared/service-proxies/service-proxies";
import { ConstsTaizhou } from "process/taizhou/consts-taizhou";

@Component({
    templateUrl: "./taizhou-setting.component.html",
    animations: [appModuleAnimation()]
})
export class TaizhouSettingComponent extends AppComponentBase
    implements OnInit {
    hospitalCode: string = "";
    hospitalArea: string = "";
    hospitalLevel: string = "";
    hospitalType: string = "";
    saving: boolean = false;
    savingtext: string = "正在保存中...";
    suffix: string;
    
    config = ConstsTaizhou.yibaoConfig;

    constructor(
        injector: Injector,
        private appSessionService: AppSessionService,
        private yibaoservice: SettingServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.suffix = this.appSessionService.tenant ? "Tenant" : "Application";
        this.hospitalCode = abp.setting.get(`Taizhou.HospitalCode.${this.suffix}`);
        this.hospitalArea = abp.setting.get(`Taizhou.HospitalArea.${this.suffix}`);
        this.hospitalLevel = abp.setting.get(`Taizhou.HospitalLevel.${this.suffix}`);
        this.hospitalType = abp.setting.get(`Taizhou.HospitalType.${this.suffix}`);
    }

    save(): void {
        let settings = {};
        settings[`Taizhou.HospitalCode.${this.suffix}`] = this.hospitalCode;
        settings[`Taizhou.HospitalArea.${this.suffix}`] = this.hospitalArea;
        settings[`Taizhou.HospitalLevel.${this.suffix}`] = this.hospitalLevel;
        settings[`Taizhou.HospitalType.${this.suffix}`] = this.hospitalType;
        this.yibaoservice.setSettings(settings).subscribe(res => {
            abp.setting.values[`Taizhou.HospitalCode.${this.suffix}`] = this.hospitalCode;
            abp.setting.values[`Taizhou.HospitalArea.${this.suffix}`] = this.hospitalArea;
            abp.setting.values[`Taizhou.HospitalLevel.${this.suffix}`] = this.hospitalLevel;
            abp.setting.values[`Taizhou.HospitalType.${this.suffix}`] = this.hospitalType;
            this.notify.info("保存成功");
        });
    }
}
