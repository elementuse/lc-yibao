import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponentBase } from '@shared/common/app-component-base';
import { queryRegisteredItemInput } from '../shared/models/queryRegisteredItemInput';
import { Subscription, Observable } from "rxjs/Rx";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DatePipe } from '@angular/common';
import { hisDataModel } from '../shared/models/hisDataModel';
import { patientModel } from '../shared/models/patientModel';
import { preSettleResultModel } from '../shared/models/preSettleResultModel';
import { HeilongjiangProcessService } from '../process.service';
import { HisServiceProxy, ProcessServiceProxy, QueryRegisteredItemInput } from '@shared/service-proxies/service-proxies';


@Component({
    templateUrl: './refund-heilongjiang.component.html'
})
export class RefundHeilongjiangComponent extends AppComponentBase implements OnInit {

    public channel: string = 'Heilongjiang';
    public providers: any;
    public user: any;
    public userid: string = '0000';
    public processid: string = '';
    protected subscription: Subscription;
    public hisData: hisDataModel;
    public state: string;// = 'NeedDataSync';
    public sequenceNumber: number;
    public failedMessage: string;
    public patient: patientModel = { allow: false, p1: '', p2: '', p3: '', p6: '', p7: '', p8: '', p9: '', p10: '', p11: '' };
    public preSettleResult: preSettleResultModel;
    public receipts: Array<any> = [];
    public subject = new BehaviorSubject('');
    public unreadMsgIds: Array<any> = [];
    public messageIdx: number = 0;
    public currentMessage: any = { p1: null };
    public password: string;
    public preRefundResult: preSettleResultModel;
    public refundReceipts: Array<any> = [];

    constructor(
        injector: Injector,
        private progressservice: ProcessServiceProxy,
        private hisservice:HisServiceProxy,
        private heilongjiangprocessservice:HeilongjiangProcessService,
        protected activatedRoute: ActivatedRoute,
        private datepipe: DatePipe,
        private router: Router
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

        this.hisData = { registerNo: '', chargeItemForms: [], doctor: { id: '', channelData: { id: '', name: '' } }, operator: { id: '' }, department: { name: '', channelData: { id: '', name: '' } }, diagnose: { name: '', channelData: { id: '', name: '' } }, diagnoses: [], total: 0 };

        //接受者订阅消息
        // this.subject.subscribe({
        //     next: (v) => {
        //         if (v == 'NeedDataSync') {
        //             this.dataSync();
        //         }
        //         else if (v == 'DataSynced') {
        //             this.loadMessages();
        //         }
        //         else if (v == 'SettleFailed') {
        //             let request = {}
        //             this.progressservice.getDataStoreItem(this.processid, 'error').subscribe(res => {
        //                 this.failedMessage = res.result;
        //             })
        //         }
        //     }
        // });
    }

    ngOnInit(): void {
        this.getRegisteredItems();
    }

    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryRegisteredItemInput = new QueryRegisteredItemInput();
        queryRegisteredItemInput.objectType = 'Provider';
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice.getRegisteredItems(queryRegisteredItemInput).subscribe(res => {
            // console.log(res);
            this.providers = res.items;
            this.user = this.providers.find(e => {
                return e.hisObjectId == this.userid;
            });
            if (this.user == null) {
                this.notify.warn(`找不到当前用户信息，请在医保平台注册用户${this.userid}`);
                this.user = {
                    channelObjectName: '默认用户',
                    channelObjectId: '0000'
                };
            }

            this.getInternalStateWithData();

        });
    }

    public getInternalStateWithData() {
        let request = {
            processId: this.processid
        }
        this.progressservice.getInternalStateWithData(this.processid).subscribe(res => {
            console.log(res);
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
            this.state = res.state;
            this.sequenceNumber = res.sequenceNumber;

            this.failedMessage = res.dataStore.error;
            this.receipts = res.dataStore.chargeReceipts ? res.dataStore.chargeReceipts : this.receipts;
            this.patient = res.dataStore.patient ? res.dataStore.patient : this.patient;
            this.preRefundResult = res.dataStore.preRefundResult ? res.dataStore.preRefundResult : this.preRefundResult;
            this.refundReceipts = res.dataStore.refundReceipts ? res.dataStore.refundReceipts : this.refundReceipts;

            // //广播state
            // this.subject.next(this.state);

        })
    }

    //读卡
    public readcard(): void {
        abp.ui.setBusy();
        this.heilongjiangprocessservice.readCardNormal(this.password).finally(()=>{
            abp.ui.clearBusy();
        })
        .subscribe(res => {
            if (res.error) {
                this.message.error(res.error,'读卡失败');
            }
            else{
                this.patient = res;
                this.patient.allow=true; // 始终允许退费
                //this.patient.allow = (this.patient.p11 == null) || (this.patient.p11 == "") || (this.patient.p11 == undefined);
            }
        })
    }

    //放弃结算
    public fail(msg: string) {
        this.message.confirm(
            '放弃保险结算', '是否确定',
             (isConfirmed)=> {
                if (isConfirmed) {
                    abp.ui.setBusy();
                    let actiondata = {actionName: 'SettleFailAction',error: msg};
                    this.progressservice.action(this.processid,actiondata).finally(()=>{
                        abp.ui.clearBusy();
                    }).subscribe(res =>{
                        this.doAction(res);
                    });
                }
            }
        );
    }

    //预结算
    public preRefund() {
        let receiptId = this.receipts[0].page1[0].p13;
        let chargeItems = [];

        this.receipts[0].page3.forEach((o)=> {
            chargeItems.push({
                p1: o.p6, //编号
                p2: o.p8, //单价
                p3: 0 - o.p9 //数量（负）
            });
        });

        let preRefundRequest = {
            p1: this.patient.p7, //ic
            p2: this.password,
            p3: receiptId,
            p4: this.user.channelObjectId, //工号是当前登录人员
            p5: 11, //医疗类别, 11=普通门诊
            p6: this.user.channelObjectId,
            p7: 1, // 收据类型
            page1: chargeItems
        };

        let seqNum = this.processid + this.sequenceNumber;

        this.heilongjiangprocessservice.preRefund(seqNum, preRefundRequest).mergeMap(res => {
            this.preRefundResult = res;
            let actiondata = {
                actionName: 'PreRefundAction',
                preRefundResult: this.preRefundResult,
                patient: this.patient
            }
            return this.progressservice.action(this.processid, actiondata)
        }).subscribe(res => {
            this.doAction(res);
        });

        abp.ui.clearBusy();

    }

    public goSetting() {
        this.router.navigate(['/process/heilongjiang_setting'], {
            queryParams: {
                canShow: true
            }
        });
    }

    public refund() {
        abp.ui.setBusy();
        let seqNum = this.processid + this.sequenceNumber;
        let request = {
            p1: this.patient.p7, //ic卡号
            p2: this.password, //密码
            p3: this.receipts[0].page1[0].p13, //原收据号
            p4: this.preRefundResult.p1// 负单流水号
        }

        // /// 暂时不用

        // var actiondata={};
        
        // try{
        //     var refundResult = await this.heilongjiangprocessservice.refund(seqNum, request).toPromise();
        //     var receipt = await this.heilongjiangprocessservice.queryReceipt({
        //         p1: refundResult.page1[0].p1, // 收据号
        //         p4: 0,
        //         p5: 1
        //     }).toPromise();
        //     actiondata = {
        //         actionName: 'RefundAction',
        //         receipts: [receipt]
        //     }
        // }
        // catch(err){

        // }
        // finally{
        //     var newState  = await this.progressservice.action(this.processid, actiondata).toPromise();
        //     this.doAction(newState);    
        // }
        // ///

        this.heilongjiangprocessservice.refund(seqNum, request)
            .mergeMap(res => {
                if (res.error != "") {
                    return Observable.create(observer => observer.next(res.error))
                }
                else{
                    let receiptIds = res.page1;
                    let receiptTask = [];
                    receiptIds.forEach(id => {
                        let request = {
                            p1: id.p1, // 收据号
                            p4: 0,
                            p5: 1
                        }
                        receiptTask.push(this.heilongjiangprocessservice.queryReceipt(request));
                    });
                    return Observable.forkJoin(receiptTask).mergeMap(res => {
                        this.refundReceipts = [];
                        res.forEach(element => {
                            this.refundReceipts.push(element);
                        });
                        let actiondata = {
                            actionName: 'RefundAction',
                            receipts: this.refundReceipts
                        }
                        return this.progressservice.action(this.processid, actiondata);
                    });
                }
            }).finally(()=>{
                abp.ui.clearBusy();
            })
            .subscribe((res:any) => {
                if (res.state) {
                    this.doAction(res);
                }
                else{
                    abp.message.error(res.error,'退费失败');
                }
            });
    }

    public printSettlement(){
        this.router.navigate(['./process/heilongjiang_print'],{ queryParams: { processId: this.processid } });
    }

    public doAction(result: any) {
        console.log(result);
        this.state = result.state;
        this.sequenceNumber = result.sequenceNumber;
        //this.subject.next(this.state);
        // this.progressservice.action(this.processid, actiondata).subscribe(result => {
        //     console.log(result);
        //     this.state = result.result.state;
        //     this.sequenceNumber = result.result.sequenceNumber;
        //     this.subject.next(this.state);
        // })
    }
}
