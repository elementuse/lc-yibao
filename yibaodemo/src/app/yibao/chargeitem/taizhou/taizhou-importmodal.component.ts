import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { ChannelObjectServiceProxy, ImportInputOfChannelObjectInput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';
import * as moment from "moment";
import { ChannelObjectFieldsWriteMode } from '@shared/AppEnums';
import { ClientTaizhouProxy } from 'process/taizhou/client-taizhou.proxy';

@Component({
    selector: 'taizhouImportModal',
    templateUrl: './taizhou-importmodal.component.html'
})
export class TaizhouImportModalComponent implements OnInit {
    constructor(
        private channelobjectservice:ChannelObjectServiceProxy,
        private taizhouProxy: ClientTaizhouProxy
    ) { }

    ngOnInit(): void { }


    channel: string = "Taizhou";
    importing: boolean = false;
    
    currentNo = "0";
    baseParams:any = {
        p1: "0"
    };
    chargeitemResult: any;


    @ViewChild('taizhouImportModal') modal: ModalDirective;
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
            "Taizhou.HospitalCode.Application"
        );
        this.baseParams.p5 = "0";
        this.baseParams.p6 = this.currentNo;

        this.importChannelObject();
    }


    importChannelObject() : void {
        this.taizhouProxy
            .catalogdownload(this.baseParams)
            .mergeMap((result: any) => {
                this.chargeitemResult = result;
                let datas: ChannelObjectInput[] = [];
                let now = moment();
                if (result.p8) {
                    result.p8.forEach(element => {
                        let data = new ChannelObjectInput();
                        data.channel = this.channel;
                        data.channelObjectId = element.p3;
                        data.channelObjectName = element.p4;
                        data.objectType = "ChargeItem";
                        if (!element.p8 || element.p8 == '') {
                            data.deleted = false;
                        }
                        else {
                            data.deleted = moment(element.p8) < now;
                        }
                        data.fields = {
                            chargeItemType: element.p2,             //药品诊疗类型
                            projectNo: element.p1,                  //中心项目编码
                            drugSpec: element.p17,                  //规格
                            drugType: element.p16,                  //剂型
                            drugUnit: element.p18,                  //单位
                            packUnit: element.p27                   //包装单位
                        };
                        datas.push(data);
                    });
                }

                let importChannelObjectInput = new ImportInputOfChannelObjectInput();
                importChannelObjectInput.channel = this.channel;
                importChannelObjectInput.objectType = "ChargeItem";
                importChannelObjectInput.fieldsWriteMode = ChannelObjectFieldsWriteMode.Override;
                importChannelObjectInput.importTime = now;
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
