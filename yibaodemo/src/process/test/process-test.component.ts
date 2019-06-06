import { Component, OnInit, Injector,DoCheck } from '@angular/core';
import { Subscription } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from '@shared/common/app-component-base';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { hisDataModel } from '../shared/models/hisDataModel';
import { DatePipe } from '@angular/common';
import { CommonProcessService } from '../process.service';
import * as _ from 'lodash';
import { ProcessServiceProxy, QueryRegisteredItemInput, HisServiceProxy, ChannelObjectServiceProxy, QueryChannelObjectInput } from '@shared/service-proxies/service-proxies';
@Component({
    templateUrl: './process-test.component.html'
})
export class ProcessTestComponent extends AppComponentBase implements OnInit,DoCheck {

    public channel: string = 'Test';
    public providers: any;
    public userid: string = '0000';
    public processid: string = '';
    protected subscription: Subscription;
    public subject = new BehaviorSubject('');
    public hisData: hisDataModel;
    public registerNo: any;
    public state: string;
    public failedMessage: string;
    public password: string;
    public baseParams: any = {};
    public registerData: any;
    public registerDate: any;
    public settleResult: any;
    public isPresettle: boolean = false;

    constructor(
        public injector: Injector,
        private commonService: CommonProcessService,
        private channelservice: ChannelObjectServiceProxy,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        protected activatedRoute: ActivatedRoute,
        private datePipe: DatePipe,
    ) {
        super(injector);
        this.subscription = this.activatedRoute.queryParams.subscribe(
            (queryParams: any) => {
                if (queryParams.userId) {
                    this.userid = queryParams.userId;
                }
                this.processid = queryParams.processId;
            }
        );

        this.baseParams = {
            processId: this.processid,
            sequenceNumber: 0
        }
    }

    ngOnInit(): void {
        this.getRegisteredItems();
    }

    ngDoCheck(): void {
        if (this.state == 'SettleFailed') {
            this.processService.getDataStoreItem(this.baseParams.processId, 'error').subscribe(result =>{
                // this.failedMessage = Object.keys(result).map(e => result[e]).join('');
            });
        }
    }

    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryRegisteredItemInput = new QueryRegisteredItemInput();
        queryRegisteredItemInput.objectType = "Provider";
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.providers = res.items;
                let operator = this.providers.find(e => {
                    return e.hisObjectId == this.userid;
                });
                if (operator == null) {
                    this.notify.warn(
                        `找不到当前操作员信息，请在医保平台注册用户${
                        this.userid
                        }`
                    );
                    operator = {
                        channelObjectId: "0000",
                        channelObjectName: "默认用户"
                    };
                }
                this.baseParams.opratorCode = operator.channelObjectId;
                this.baseParams.opratorName = operator.channelObjectName;

                return this.getInternalStateWithData();
            });
    }

    public getInternalStateWithData() {
        let request = {
            processId: this.processid
        }
        this.commonService.getInternalStateWithData(this.processid).subscribe(result => {
            let res = result.result;
            let tempdata = res.orderData;
            tempdata.chargeItemForms.forEach(form => {
                form.chargeItems.forEach(item => {
                    if (item.chargeItem.channelData != null && item.chargeItem.channelData.id != null) {
                        Object.assign(item,{insurance:true});
                    } else {
                        Object.assign(item,{insurance:false});
                    }
                });
            });

            this.hisData = tempdata;
            
            this.registerNo = res.orderData.registerNo;
            this.state = res.state;
            this.baseParams.sequenceNumber = res.sequenceNumber;
            this.failedMessage = res.dataStore.error;
            this.registerData = res.dataStore.registerData ? res.dataStore.registerData : this.registerData;
            this.registerDate = res.dataStore.registerDate ? res.dataStore.registerDate : this.registerDate;
            this.settleResult = res.dataStore.settleResult ? res.dataStore.settleResult : this.settleResult;

        })
    }

    settle(): any {
        // 检查深圳医保门诊流水号是否为空
        if (this.registerNo == null || this.registerNo.length == 0) {
            abp.notify.error('门诊流水号不能为空');
            return;
        }

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        let total=0;

        let chargeItems = [];
        let categoryTotals = {};
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        code: item.chargeItem.channelData.id
                    });

                    total += item.total;
                }
            });
        });

        let sel =
        {
            total: total,
            accountDisburse: total,
            cashDisburse: 0,
            balance: 100,
        };

        if ($('#rdo1').is(':checked')) {
            sel.total = total;
            sel.accountDisburse = total;
            sel.cashDisburse = 0;
            sel.balance = 100;

        } else if ($('#rdo2').is(':checked')) {
            sel.total = (Math.floor(total * 0.8 * 100) / 100);
            sel.accountDisburse = (Math.floor(total * 0.8 * 100) / 100);
            sel.cashDisburse = Math.floor(total - sel.accountDisburse);
            sel.balance = 100;

        } else if ($('#rdo3').is(':checked')) {
            sel.total = 0;
            sel.accountDisburse = 0;
            sel.cashDisburse = total;
            sel.balance = 100;
        }

        this.settleResult = sel;

        let actiondata = {
            actionName: 'SettleAction',
            hisData: this.hisData,
            settleResult: sel
        };

        var res = this.processService.action(this.processid, actiondata).subscribe(res => {
            this.message.success("结算完成");
            this.doAction(res);
        });
    }

    settleErrorData(msg: string): void {

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        let total = 0;

        let chargeItems = [];
        let categoryTotals = {};
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        code: item.chargeItem.channelData.id
                    });

                    total += item.total;
                }
            });
        });

        let sel =
        {
            total: total,
            accountDisburse: total + 10,
            cashDisburse: 0,
            balance: 100,
        };

        this.settleResult = sel;

        let actiondata = {
            actionName: 'SettleAction',
            hisData: this.hisData,
            settleResult: sel
        };

        var res = this.processService.action(this.processid, actiondata).subscribe(res => {
            this.message.success("结算完成");
            this.doAction(res);
        });
    }

    public print(): any {
        window.print();
    }

    fail(msg:string): void {
        this.message.confirm(
            msg,
            (isConfirmed)=>{
                if (isConfirmed) {
                    abp.ui.setBusy();

                    let actiondata = {
                        actionName: 'SettleFailAction',
                        error: msg
                    };
                    this.processService.action(this.processid,actiondata).subscribe(res =>{
                        this.doAction(res);
                        abp.ui.clearBusy();
                    });
                }
            }
        );
    }
    

    public doAction(result: any): any {
        console.log(result);
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
    }
}
