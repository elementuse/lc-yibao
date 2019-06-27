import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { SettingServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./<%= dasherize(name) %>-setting.component.html",
    animations: [appModuleAnimation()]
})
export class <%= classify(name) %>SettingComponent extends AppComponentBase
    implements OnInit {
    hospitalCode: string = "";
    saving: boolean = false;
    savingtext: string = "正在保存中...";
    suffix: string;

    constructor(
        injector: Injector,
        private appSessionService: AppSessionService,
        private yibaoservice: SettingServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.suffix = this.appSessionService.tenant ? "Tenant" : "Application";
        this.hospitalCode = abp.setting.get(`<%= classify(name) %>.HospitalCode.${this.suffix}`);
    }

    save(): void {
        let settings = {};
        settings[`<%= classify(name) %>.HospitalCode.${this.suffix}`] = this.hospitalCode;
        this.yibaoservice.setSettings(settings).subscribe(res => {
            abp.setting.values[`<%= classify(name) %>.HospitalCode.${this.suffix}`] = this.hospitalCode;
            this.notify.info("保存成功");
        });
    }
}
