import { Component, OnInit, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { DatePipe } from '@angular/common';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ChannelObjectServiceProxy, GetImportInfoInput, ImportInputOfChannelObjectInput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';
import * as moment from "moment";
import { Observable } from 'rxjs';
import { ChannelObjectFieldsWriteMode } from '@shared/AppEnums';
import { ClientHangzhouProxy } from 'process/hangzhou/client-hangzhou.proxy';

@Component({
    selector: 'hangzhouImportModal',
    templateUrl: './hangzhou-importmodal.component.html'
})
export class HangzhouImportModalComponent implements OnInit, AfterViewInit {
    constructor(
        private channelobjectservice:ChannelObjectServiceProxy,
        private hangzhouyibaoservice:ClientHangzhouProxy,
        private datepipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.selectedChargeItem = this.chargeItemTypeLookup[0];
    }

    ngAfterViewInit(): void {
        this.getLastImportTime();
    }




    ch = yibaoConsts.ch;
    channel: string = "Hangzhou";
    importing: boolean = false;
    selectedChargeItem:any = {};
    baseParams:any = {};
    selectedCode:string = "01";
    value:number = 0;
    batchSize = 1000;
    chargeItemTypeLookup: Array<any> = [
        { code: "01", name: "药品", lastImportTime: "" },
        { code: "02", name: "诊疗项目", lastImportTime: "" },
        { code: "03", name: "医用材料", lastImportTime: "" },
    ];
    lastImportTime:any;


    @ViewChild('hangzhouImportModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    show(): void {
        const self = this;
        self.modal.show();
    }

    close(): void {
        this.modal.hide();
    }

    getLastImportTime(): void {
        if (!this.selectedCode) {
            return;
        }

        let request: GetImportInfoInput = new GetImportInfoInput();
        request.channel = this.channel;
        request.objectType = 'ChargeItem';
        request.objectSubType = this.selectedCode;
        request.registered = false;
        this.channelobjectservice.getImportInfo(request).subscribe(res => {
            let index = this.getChargeItemIndex(this.selectedCode);
            let lastTime = res.lastUpdateTime.isBefore(moment().subtract(3, 'month')) ? moment().subtract(3, 'month') : res.lastUpdateTime;
            this.lastImportTime = this.datepipe.transform(lastTime, 'yyyy-MM-dd');
            this.chargeItemTypeLookup[index].lastImportTime = this.lastImportTime;
        })
    }

    chargeItemTypeselectChange() {
        let index = this.getChargeItemIndex(this.selectedCode);
        if (this.chargeItemTypeLookup[index].lastImportTime == '') {
            this.getLastImportTime();
        }
        else {
            this.lastImportTime = this.chargeItemTypeLookup[index].lastImportTime;
        }
    }

    getChargeItemIndex(code) :number {
        let index:number;
        index = this.chargeItemTypeLookup.findIndex( o => {
            return o.code == code;
        });
        return index;
    }

    import(){
        this.baseParams.P2 = this.datepipe.transform(this.lastImportTime,'yyyy-MM-dd');
        let downloadObservable:Observable<any>;
        if(this.selectedCode == '01'){
            downloadObservable = this.hangzhouyibaoservice.drugdownload(this.baseParams).mergeMap(res => {
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach(element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p29 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p6,       //收费类别
                        drugType: element.p10,                //剂型
                        drugSpec: element.p58,                //规格
                        drugUnit: element.p13                 //单位
                    };
                    datas.push(data);
                });
                this.value = 20;
                return this.importChannelObject(this.selectedCode,datas,0);
            });
        }
        else if(this.selectedCode == '02'){
            downloadObservable = this.hangzhouyibaoservice.diagnosisdownload(this.baseParams).mergeMap(res => {
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach(element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p11 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p13,      //收费类别
                        drugSpec: element.p16,                //规格
                        drugUnit: element.p15                 //单位
                    };
                    datas.push(data);
                });
                this.value = 20;
                return this.importChannelObject(this.selectedCode,datas,0);
            });
        }
        else if(this.selectedCode = '03'){
            downloadObservable = this.hangzhouyibaoservice.materialdownload(this.baseParams).mergeMap(res =>{
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach( element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p20 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p8,       //收费类别
                        drugSpec: element.p27,                //规格
                        drugUnit: element.p29                 //单位
                    };
                    datas.push(data);
                });
                this.value = 20;
                return this.importChannelObject(this.selectedCode,datas,0);
            });
        }

        this.importing = true;
        downloadObservable.finally(()=>{
            this.importing = false;
            this.value = 0;
        }).subscribe(()=>{
            this.close();
            this.modalSave.emit(null);
        });
    }


    importChannelObject(objectSubType:string,datas:any,index:number) : Observable<any> {
        let total = datas.length;
        let count = Math.ceil(total / this.batchSize);

        let start = index * this.batchSize;
        let end = (index + 1) * this.batchSize;

        let importChannelObjectInput = new ImportInputOfChannelObjectInput();
        importChannelObjectInput.channel = this.channel;
        importChannelObjectInput.objectType = "ChargeItem";
        importChannelObjectInput.objectSubType = objectSubType;
        importChannelObjectInput.fieldsWriteMode = ChannelObjectFieldsWriteMode.Override;
        importChannelObjectInput.importTime = moment();
        importChannelObjectInput.channelObjects = datas.slice(start,end);
        return this.channelobjectservice.import(importChannelObjectInput).mergeMap(res => {
            let per = 20 + Math.round((index + 1) / count * 80);
            this.value = per;
            if( end < total){
                return this.importChannelObject(objectSubType,datas,index+1)
            }
            else{
                abp.notify.info('导入完成');
                return Observable.of(null);
            }
        });
    }
}
