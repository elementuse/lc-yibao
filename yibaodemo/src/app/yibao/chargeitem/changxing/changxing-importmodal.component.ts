import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { ChannelObjectServiceProxy, ImportInputOfChannelObjectInput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';
import * as moment from "moment";
import { ChannelObjectFieldsWriteMode } from '@shared/AppEnums';
import { ClientChangxingProxy } from 'process/changxing/client-changxing.proxy';

@Component({
    selector: 'changxingImportModal',
    templateUrl: './changxing-importmodal.component.html'
})
export class ChangxingImportModalComponent implements OnInit {
    constructor(
        private channelobjectservice:ChannelObjectServiceProxy,
        private changxingProxy: ClientChangxingProxy
    ) { }

    ngOnInit(): void { }


    channel: string = "Changxing";
    importing: boolean = false;
    
    currentNo = "0";
    baseParams:any = {
        p1: "0",
        p2: "",
        p3: "1",
        p4: ""
    };
    chargeitemResult: any;


    @ViewChild('changxingImportModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    show(): void {
        this.currentNo = "0";
        this.modal.show();
    }

    close(): void {
        this.modal.hide();
    }

    import(){
        this.importing = true;

        this.baseParams.hospitalCode = abp.setting.get(
            "Changxing.HospitalCode.Application"
        );
        this.baseParams.p5 = "0";
        this.baseParams.p6 = this.currentNo;

        this.importChannelObject();
    }


    importChannelObject() : void {
        this.changxingProxy
            .catalogdownload(this.baseParams)
            .mergeMap((result: any) => {
                this.chargeitemResult = result;
                let datas: ChannelObjectInput[] = [];
                if (result.p8) {
                    result.p8.forEach(element => {
                        let data = new ChannelObjectInput();
                        data.channel = this.channel;
                        data.channelObjectId = element.p3;
                        data.channelObjectName = element.p4;
                        data.objectType = "ChargeItem";
                        data.deleted = false;
                        data.fields = {
                            chargeItemType: element.p2,             //药品诊疗类型
                            chargeItemCategory: element.p7,         //收费类别
                            drugSpec: element.p13,                  //规格
                            drugType: element.p12,                  //剂型
                            drugUnit: element.p14                   //单位
                        };
                        datas.push(data);
                    });
                }

                let importChannelObjectInput = new ImportInputOfChannelObjectInput();
                importChannelObjectInput.channel = this.channel;
                importChannelObjectInput.objectType = "ChargeItem";
                importChannelObjectInput.fieldsWriteMode = ChannelObjectFieldsWriteMode.Override;
                importChannelObjectInput.importTime = moment();
                importChannelObjectInput.channelObjects = datas;
                return this.channelobjectservice.import(
                    importChannelObjectInput
                );
            })
            .subscribe(result => {
                if (this.chargeitemResult.p6 == "1") {
                    this.currentNo = this.chargeitemResult.p8[this.chargeitemResult.p8.length - 1].p1
                    this.baseParams.p6 = this.currentNo;
                    this.importChannelObject();
                }
                else {
                    abp.notify.info('导入完成');
                    this.importing =false;
                }
            });
    }
}
