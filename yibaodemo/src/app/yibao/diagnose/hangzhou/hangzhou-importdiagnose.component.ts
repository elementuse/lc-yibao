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
    selector: 'hangzhouImportDiagnoseModal',
    templateUrl: './hangzhou-importdiagnose.component.html'
})
export class HangzhouImportDiagnoseComponent implements OnInit, AfterViewInit {
    constructor(
        private channelobjectservice:ChannelObjectServiceProxy,
        private hangzhouyibaoservice:ClientHangzhouProxy,
        private datepipe: DatePipe
    ) { }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        this.getLastImportTime();
    }

    ch = yibaoConsts.ch;
    channel: string = "Hangzhou";
    importing: boolean = false;
    baseParams:any = {};
    value:number = 0;
    batchSize = 1000;
    lastImportTime:any;


    @ViewChild('hangzhouImportDiagnoseModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    show(): void {
        this.modal.show();
    }

    close(): void {
        this.modal.hide();
    }

    getLastImportTime(): void {
        let request: GetImportInfoInput = new GetImportInfoInput();
        request.channel = this.channel;
        request.objectType = 'Diagnose';
        request.registered = false;
        this.channelobjectservice.getImportInfo(request).subscribe(res => {
            let lastTime = res.lastUpdateTime.isBefore(moment().subtract(3, 'month')) ? moment().subtract(3, 'month') : res.lastUpdateTime;
            this.lastImportTime = this.datepipe.transform(lastTime, 'yyyy-MM-dd');
        })
    }

    import(){
        this.baseParams.P2 = this.datepipe.transform(this.lastImportTime,'yyyy-MM-dd');

        this.importing = true;
        this.hangzhouyibaoservice.diseasedownload(this.baseParams).mergeMap(res => {
            let datas: ChannelObjectInput[] = [];
            res.datas.forEach(element => {
                let data = new ChannelObjectInput();
                data.channel = this.channel;
                data.channelObjectId = element.p1;
                data.channelObjectName = element.p2;
                data.objectType = "Diagnose";
                data.deleted = element.p9 == 0;
                data.fields = {};
                datas.push(data);
            });
            this.value = 20;
            return this.importChannelObject(datas,0);
        }).finally(()=>{
            this.importing = false;
            this.value = 0;
        }).subscribe(()=>{
            this.close();
            this.modalSave.emit(null);
        });
    }


    importChannelObject(datas:any,index:number) : Observable<any> {
        let total = datas.length;
        let count = Math.ceil(total / this.batchSize);

        let start = index * this.batchSize;
        let end = (index + 1) * this.batchSize;

        let importChannelObjectInput = new ImportInputOfChannelObjectInput();
        importChannelObjectInput.channel = this.channel;
        importChannelObjectInput.objectType = "Diagnose";
        importChannelObjectInput.fieldsWriteMode = ChannelObjectFieldsWriteMode.Override;
        importChannelObjectInput.importTime = moment();
        importChannelObjectInput.channelObjects = datas.slice(start,end);
        return this.channelobjectservice.import(importChannelObjectInput).mergeMap(res => {
            let per = 20 + Math.round((index + 1) / count * 80);
            this.value = per;
            if( end < total){
                return this.importChannelObject(datas,index+1)
            }
            else{
                abp.notify.info('导入完成');
                return Observable.of(null);
            }
        });
    }
}