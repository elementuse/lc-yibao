import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { ModalDirective } from "ngx-bootstrap";
import { DatePipe } from "@angular/common";
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ShenzhenYibaoService } from "@app/yibao/yibao.service";
import {
    ChannelObjectServiceProxy,
    GetImportInfoInput,
    ChannelObjectInput,
    ImportInputOfChannelObjectInput
} from "@shared/service-proxies/service-proxies";
import * as moment from "moment";
import { ChannelObjectFieldsWriteMode } from "@shared/AppEnums";

@Component({
    selector: "shenzhenImportDiagnoseModal",
    templateUrl: "./shenzhen-importdiagnose.component.html"
})
export class ShenzhenImportDiagnoseComponent implements OnInit, AfterViewInit {
    constructor(
        private channelobjectservice: ChannelObjectServiceProxy,
        private shenzhenyibaoservice: ShenzhenYibaoService,
        private datepipe: DatePipe
    ) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.getLastImportTime();
    }

    ch = yibaoConsts.ch;
    channel: string = "ShenzhenYibao";
    importing: boolean = false;
    lastImportTime: any;

    percentage: string = "0";
    importCount: number = 0;

    diagnoseParams: any = {
        operatorCode: "0000",
        operatorName: "默认用户"
    };
    diagnoseResult: any;

    @ViewChild("shenzhenImportDiagnoseModal") modal: ModalDirective;

    show(): void {
        const self = this;
        self.modal.show();
    }

    close(): void {
        this.modal.hide();
    }

    getLastImportTime(): void {
        let request: GetImportInfoInput = new GetImportInfoInput();
        request.channel = this.channel;
        request.objectType = "Diagnose";
        request.registered = false;
        this.channelobjectservice.getImportInfo(request).subscribe(res => {
            this.lastImportTime = this.datepipe.transform(
                res.lastUpdateTime,
                "yyyy-MM-dd"
            );
        });
    }

    import() {
        this.importing = true;

        this.diagnoseParams.hospitalCode = abp.setting.get(
            "Shenzhen.HospitalCode.Application"
        );
        this.diagnoseParams.pageno = 0;
        this.percentage = "0";
        this.importCount = 0;

        this.importDiagnose();
    }

    importDiagnose(): void {
        this.shenzhenyibaoservice
            .ml004(this.diagnoseParams)
            .mergeMap((result: any) => {
                this.diagnoseResult = result;
                let datas: ChannelObjectInput[] = [];
                if (result.outputlist) {
                    result.outputlist.forEach(element => {
                        let data = new ChannelObjectInput();
                        data.channel = this.channel;
                        data.channelObjectId = element.aka120;
                        data.channelObjectName = element.aka121;
                        data.objectType = "Diagnose";
                        data.deleted = element.aae569 == "0";
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
                this.importCount += this.diagnoseResult.outputlist.length;
                this.percentage = ((this.importCount / this.diagnoseResult.totalsize) * 100).toFixed(2);
                if (this.diagnoseResult.endpage == "0") {
                    this.diagnoseParams.pageno = this.diagnoseResult.pageno + 1;
                    this.importDiagnose();
                }
                else {
                    abp.notify.info('导入完成');
                    this.importing =false;
                }
            });
    }
}
