import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { SettingServiceProxy } from "@shared/service-proxies/service-proxies";
import { merchantModel } from "@app/yibao/setting/qingdao/merchantModel";

@Component({
    selector: "app-qingdao-setting",
    templateUrl: "./qingdao-setting.component.html",
    animations: [appModuleAnimation()]
})
export class QingdaoSettingComponent extends AppComponentBase
    implements OnInit {
    merchant: merchantModel;
    saving: boolean = false;
    savingtext: string = "正在保存中...";
    key: string = "Qingdao.MerchantInfo";

    constructor(
        injector: Injector,
        private appSessionService: AppSessionService,
        private yibaoservice: SettingServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.merchant = merchantModel.fromJSON(abp.setting.get(this.key));
    }

    save() {
        let json = JSON.stringify(this.merchant);
        this.yibaoservice.setSetting(this.key, json).subscribe(() => {
            abp.setting.values[this.key] = json;
            this.notify.info("保存成功");
        });
    }
}
