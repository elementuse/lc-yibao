import { Component, OnInit, ViewChild } from "@angular/core";
import { ModalDirective } from "ngx-bootstrap";
import {
    ChannelObjectServiceProxy,
    ChannelObjectInput,
    ImportInputOfChannelObjectInput
} from "@shared/service-proxies/service-proxies";
import * as moment from "moment";
import { ChannelObjectFieldsWriteMode } from "@shared/AppEnums";
import { ClientChangxingProxy } from "process/changxing/client-changxing.proxy";

@Component({
    selector: "changxingImportDiagnoseModal",
    templateUrl: "./changxing-importdiagnose.component.html"
})
export class ChangxingImportDiagnoseComponent implements OnInit {
    constructor(
        private channelobjectservice: ChannelObjectServiceProxy,
        private changxingProxy: ClientChangxingProxy
    ) {}

    ngOnInit(): void {}

    channel: string = "Changxing";
    importing: boolean = false;

    currentNo = "0";
    diagnoseParams: any = {
        p1: "0",
        p2: "",
        p3: "1",
        p4: ""
    };
    diagnoseResult: any;

    @ViewChild("changxingImportDiagnoseModal") modal: ModalDirective;

    show(): void {
        this.currentNo = "0";
        this.modal.show();
    }

    close(): void {
        this.modal.hide();
    }

    import() {
        this.importing = true;

        this.diagnoseParams.hospitalCode = abp.setting.get(
            "Changxing.HospitalCode.Application"
        );
        this.diagnoseParams.p5 = this.currentNo;

        this.importDiagnose();
    }

    importDiagnose(): void {
        this.changxingProxy
            .diseasedownload(this.diagnoseParams)
            .mergeMap((result: any) => {
                this.diagnoseResult = result;
                let datas: ChannelObjectInput[] = [];
                if (result.p8) {
                    result.p8.forEach(element => {
                        let data = new ChannelObjectInput();
                        data.channel = this.channel;
                        data.channelObjectId = element.p2;
                        data.channelObjectName = element.p3;
                        data.objectType = "Diagnose";
                        data.deleted = element.p8 == "1";
                        data.fields = {};
                        datas.push(data);
                    });
                }

                let importChannelObjectInput = new ImportInputOfChannelObjectInput();
                importChannelObjectInput.channel = this.channel;
                importChannelObjectInput.objectType = "Diagnose";
                importChannelObjectInput.fieldsWriteMode = ChannelObjectFieldsWriteMode.Override;
                importChannelObjectInput.importTime = moment();
                importChannelObjectInput.channelObjects = datas;
                return this.channelobjectservice.import(
                    importChannelObjectInput
                );
            })
            .subscribe(result => {
                if (this.diagnoseResult.p6 == "1") {
                    this.currentNo = this.diagnoseResult.p8[this.diagnoseResult.p8.length - 1].p1
                    this.diagnoseParams.p5 = this.currentNo;
                    this.importDiagnose();
                }
                else {
                    abp.notify.info('导入完成');
                    this.importing =false;
                }
            });
    }
}
