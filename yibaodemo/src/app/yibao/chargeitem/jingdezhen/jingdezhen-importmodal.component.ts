import { Component, OnInit, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { DatePipe } from '@angular/common';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { importInput } from '@app/yibao/models/importInput';
import { channelObjectInput } from '@app/yibao/models/channelObjectInput';
import { JingdezhenYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, GetImportInfoInput, ImportInputOfChannelObjectInput, ImportInputOfChannelObjectInputFieldsWriteMode, ImportOutput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';
import * as moment from "moment";
import { Observable } from 'rxjs';
import { ChannelObjectFieldsWriteMode } from '@shared/AppEnums';

@Component({
    selector: 'jingdezhenImportModal',
    templateUrl: './jingdezhen-importmodal.component.html'
})
export class JingdezhenImportModalComponent implements OnInit, AfterViewInit {
    constructor(
        private channelobjectservice:ChannelObjectServiceProxy,
        private jingdezhenyibaoservice:JingdezhenYibaoService,
        private datepipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.selectedChargeItem = this.chargeItemTypeLookup[0];
    }

    ngAfterViewInit(): void {
        this.getLastImportTime();
    }




    ch = yibaoConsts.ch;
    channel: string = "Jingdezhen";
    importing: boolean = false;
    selectedChargeItem:any = {};
    baseParams:any = {};
    selectedCode:string = "01";
    value:number = 0;
    batchSize = 1000;
    chargeItemTypeLookup: Array<any> = [
        { code: "01", name: "药品", lastImportTime: "" },
        { code: "02", name: "诊疗项目", lastImportTime: "" },
        { code: "03", name: "服务设施", lastImportTime: "" },
    ];
    lastImportTime:any;


    @ViewChild('jingdezhenImportModal') modal: ModalDirective;
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
            this.lastImportTime = this.datepipe.transform(res.lastUpdateTime, 'yyyy-MM-dd');
            this.chargeItemTypeLookup[index].lastImportTime = this.lastImportTime;
        })
    }

    chargeItemTypeselectChange() {
        let index = this.getChargeItemIndex(this.selectedCode);
        if (this.chargeItemTypeLookup[index].lastImportTime == '') {
            this.getLastImportTime();
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
        this.baseParams.opratorCode = '0000';
        this.baseParams.P2 = this.datepipe.transform(this.lastImportTime,'yyyyMMddHHmmss');
        let downloadObservable:Observable<any>;
        if(this.selectedCode == '01'){
            downloadObservable = this.jingdezhenyibaoservice.drugDownload(this.baseParams).mergeMap(res => {
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach(element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p21 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p6,       //收费类别
                        drugType: element.p9,                 //剂型
                        drugSpec: element.p13,                //规格
                        drugDoage: element.p10,               //每次用量
                        drugUseFrequency: element.p11,        //使用频次
                        drugUnit: element.p12                 //单位
                    };
                    datas.push(data);
                });
                this.value = 20;
                return this.importChannelObject(this.selectedCode,datas,0);
            });
        }
        else if(this.selectedCode == '02'){
            downloadObservable = this.jingdezhenyibaoservice.diagnosisDownload(this.baseParams).mergeMap(res => {
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach(element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p9 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p11,      //收费类别
                    };
                    datas.push(data);
                });
                this.value = 20;
                return this.importChannelObject(this.selectedCode,datas,0);
            });
        }
        else if(this.selectedCode = '03'){
            downloadObservable = this.jingdezhenyibaoservice.serviceDownload(this.baseParams).mergeMap(res =>{
                let datas: ChannelObjectInput[] = [];
                res.datas.forEach( element => {
                    let data = new ChannelObjectInput();
                    data.channel = this.channel;
                    data.channelObjectId = element.p1;
                    data.channelObjectName = element.p2;
                    data.objectType = "ChargeItem";
                    data.deleted = element.p9 == 0;
                    data.fields = {
                        chargeItemType: parseInt(this.selectedCode) + '',
                        chargeItemCategory: element.p10,      //收费类别
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
