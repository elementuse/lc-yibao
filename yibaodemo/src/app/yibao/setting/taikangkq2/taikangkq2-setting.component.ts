import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { SettingServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./taikangkq2-setting.component.html",
    animations: [appModuleAnimation()]
})
export class TaikangKq2SettingComponent extends AppComponentBase
    implements OnInit {
    saving: boolean = false;
    savingtext: string = "正在保存中...";
    
    hospitalCode: string = "";
    hospitalCodeKey: string;
    brandName: string = "";
    brandNameKey: string;
    storeName: string = "";
    storeNameKey: string;


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
        this.hospitalCodeKey = `TaikangKq2.HospitalCode.${this.suffix}`;
        this.hospitalCode = abp.setting.get(this.hospitalCodeKey);

        this.brandNameKey = `TaikangKq2.BrandName.${this.suffix}`;
        this.brandName = abp.setting.get(this.brandNameKey);

        this.storeNameKey = `TaikangKq2.StoreName.${this.suffix}`;
        this.storeName = abp.setting.get(this.storeNameKey);
    }

    async save(): Promise<any> {
        await this.yibaoservice.setSetting(this.hospitalCodeKey,this.hospitalCode).toPromise();
        abp.setting.values[this.hospitalCodeKey] = this.hospitalCode;
        await this.yibaoservice.setSetting(this.brandNameKey,this.brandName).toPromise();
        abp.setting.values[this.brandNameKey] = this.brandName;
        await this.yibaoservice.setSetting(this.storeNameKey,this.storeName).toPromise();
        abp.setting.values[this.storeNameKey] = this.storeName;
        this.notify.info("保存成功");
    }
}
