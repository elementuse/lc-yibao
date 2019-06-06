import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponentBase } from '@shared/common/app-component-base';
import { queryRegisteredItemInput } from '../shared/models/queryRegisteredItemInput';
import { Subscription, Observable } from "rxjs/Rx";
import { getImportInfoInput } from '../shared/models/getImportInfoInput';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DatePipe } from '@angular/common';
import { hisDataModel } from '../shared/models/hisDataModel';
import { channelDataModel } from '../shared/models/channeldataModel';
import { patientModel } from '../shared/models/patientModel';
import { preSettleResultModel } from '../shared/models/preSettleResultModel';
import { HeilongjiangProcessService, CommonProcessService, ShenzhenYibaoService } from '../process.service';
import { HisServiceProxy, ProcessServiceProxy, QueryRegisteredItemInput, ChannelObjectServiceProxy, QueryChannelObjectInput } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './process-heilongjiang.component.html'
})
export class ProcessHeilongjiangComponent extends AppComponentBase implements OnInit {

    public channel: string = 'Heilongjiang';
    public providers: any;
    public user: any;
    public userid: string = '0000';
    public processid: string = '';
    protected subscription: Subscription;
    public hisData: any = {};
    public state: string;// = 'NeedDataSync';
    public sequenceNumber: number;
    public failedMessage: string;
    public patient: patientModel = { allow: false, p1: '', p2: '', p3: '', p6: '', p7: '', p8: '', p9: '', p10: '', p11: '' };
    public preSettleResult: preSettleResultModel;
    public receipts: Array<any> = [];
    public subject = new BehaviorSubject('');
    public unreadMsgIds: Array<any> = [];
    public messageIdx: number = 0;
    public messagecount: number = 0;
    public currentMessage: any = { p1: null };
    public password: string;
    public approveReason: string;
    public alertRecord: any;
    public alertDetail: any;
    public smName = null;
    public smChargeRecords: any;
    public saving = false;
    public isLoading = false;

    constructor(
        injector: Injector,
        private progressservice: ProcessServiceProxy,
        private channelservice: ChannelObjectServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private heilongjiangprocessservice: HeilongjiangProcessService,
        protected activatedRoute: ActivatedRoute,
        private datepipe: DatePipe,
        private router: Router,
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

        //接受者订阅消息
        this.subject.subscribe({
            next: (v) => {
                if (v == 'NeedDataSync') {
                    this.dataSync();
                }
                else if (v == 'DataSynced') {
                    this.loadMessages();
                }
                else if (v == 'Alerted') {
                    this.loadAlert();
                }
                else if (v == 'SettleFailed') {
                    let request = {}
                    this.progressservice.getDataStoreItem(this.processid, 'error').subscribe(res => {
                    })
                }
            }
        });
    }

    ngOnInit(): void {
        this.getRegisteredItems();
    }

    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryChannelObjectInput = new QueryChannelObjectInput();
        queryRegisteredItemInput.channel = this.channel;
        queryRegisteredItemInput.objectType = 'Provider';
        queryRegisteredItemInput.registered = true;
        queryRegisteredItemInput.state = 1;
        queryRegisteredItemInput.source = 1, // tenant
            queryRegisteredItemInput.maxResultCount = 1000;

        this.channelservice.query(queryRegisteredItemInput).subscribe(res => {
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
        this.commonservice.getInternalStateWithData(this.processid).subscribe(result => {
            let res = result.result;
            let tempdata = res.orderData;
            tempdata.chargeItemForms.forEach(form => {
                form.chargeItems.forEach(item => {
                    if (item.chargeItem.channelData != null && item.chargeItem.channelData.id != null) {
                        Object.assign(item, { insurance: true });
                    } else {
                        Object.assign(item, { insurance: false });
                    }
                });
            });

            this.hisData = tempdata;
            this.state = res.state;
            this.sequenceNumber = res.sequenceNumber;

            this.failedMessage = res.dataStore.error;
            this.patient = res.dataStore.patient ? res.dataStore.patient : this.patient;
            this.preSettleResult = res.dataStore.preSettleResult ? res.dataStore.preSettleResult : this.preSettleResult;
            this.receipts = res.dataStore.yibaoReceipts ? res.dataStore.yibaoReceipts : this.receipts;

            //广播state
            this.subject.next(this.state);

        })
    }

    //数据同步
    public dataSync(): void {
        abp.ui.setBusy();
        this.saving = true;
        let request: getImportInfoInput = {
            channel: 'Heilongjiang',
            objectType: 'ChargeItem',
            registered: true
        }
        this.heilongjiangprocessservice.getImportInfo(request).mergeMap((result: any) => {
            let request = {
                actionname: 'DataSyncAction'
            };
            return this.progressservice.action(this.processid, request);//doAction(request);
        }).finally(() => {
            abp.ui.clearBusy();
            this.saving = false;
        }).subscribe(res => {
            this.notify.info('数据导入成功');
            this.doAction(res);
        });

        //this.subject.next('DataSynced');
        //this.state = 'DataSynced';
    }

    //加载消息
    public loadMessages(): void {
        abp.ui.setBusy();
        this.saving = true;
        let request = {
            p1: '2018-01-01',
            p2: this.datepipe.transform(new Date(), 'yyyy-MM-dd'),
            p3: this.user.channelObjectId,
            p4: '0'
        }
        this.heilongjiangprocessservice.getPublishNews(request).finally(() => {
            abp.ui.clearBusy();
            this.saving = false;
        }).subscribe(res => {
            this.unreadMsgIds = res.p1;
            this.readMessage();
        });

    }

    //阅读消息
    public readMessage(): void {
        if (this.unreadMsgIds == null || this.unreadMsgIds.length <= this.messageIdx) {
            this.progressservice.action(this.processid, { actionName: 'CheckMessageAction' }).subscribe(res => {
                this.doAction(res);
            });
        }
        else {
            //this.messagecount = this.unreadMsgIds.length;
            let msgId = this.unreadMsgIds[this.messageIdx].p1;
            let request = {
                p1: msgId,
                p2: this.user.channelObjectId,
                p3: this.user.channelObjectName
            }
            this.heilongjiangprocessservice.readPublishNews(request).subscribe(res => {
                if (res.error) {
                    this.message.error(res.error, '阅读消息失败');
                }
                else {
                    this.currentMessage = res;
                    this.messagecount = this.unreadMsgIds.length - this.messageIdx;
                    //this.unreadMsgIds.splice(this.messageIdx,1);
                    this.messageIdx++;
                }
            })
        }
    }

    //读卡
    public readcard(): void {
        abp.ui.setBusy();
        this.heilongjiangprocessservice.readCardNormal(this.password)
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                if (res.error) {
                    this.message.error(res.error,'读卡失败');
                }
                this.patient = res;
                this.patient.allow = (this.patient.p11 == null) || (this.patient.p11 == "") || (this.patient.p11 == undefined);
            })
    }

    //放弃结算
    public fail(msg: string) {
        this.message.confirm(
            '放弃保险结算', '是否确定',
            (isConfirmed) => {
                if (isConfirmed) {
                    abp.ui.setBusy();
                    let actiondata = { actionName: 'SettleFailAction', error: msg };
                    this.progressservice.action(this.processid, actiondata).finally(() => {
                        abp.ui.clearBusy();
                    }).subscribe(res => {
                        this.doAction(res);
                    });
                }
            }
        );
    }
    
    //预结算
    public preSettle() {
        let chargeItems = [];
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        p1: item.chargeItem.channelData.categoryCode,
                        p2: item.chargeItem.id,
                        p3: item.chargeItem.channelData.name, //项目名称不一致会出现问题
                        p4: item.chargeItem.channelData.id,
                        p5: item.chargeItem.channelData.name,
                        p6: item.chargeItem.price,
                        p7: item.amount,
                        p8: item.total,
                        p9: item.chargeItem.channelData.drugTypeCode ? item.chargeItem.channelData.drugTypeCode : "000",
                        p10: item.chargeItem.channelData.drugDoage,
                        p11: item.chargeItem.channelData.drugUseFrequency,
                        p12: item.chargeItem.channelData.drugUseDays
                    })
                }
            });
        });

        let operator = this.providers.find(o => {
            return o.hisObjectId == this.hisData.operator.id
        });

        if (operator == null) {
            this.notify.error('请选择操作人');
            return;
        }

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        })

        if (doctor == null) {
            this.notify.error('请选择医生');
            return;
        }

        abp.ui.setBusy();
        let request = {
            p1: this.patient.p7,
            p2: this.password,
            p3: operator.channelObjectId, //工号是
            p4: 11, //医疗类别, 11=普通门诊
            p5: operator.channelObjectId,//收款员编号
            p6: operator.channelObjectName,
            p7: doctor.channelObjectName,
            p8: this.hisData.department.name, //就诊科室名称
            p9: this.hisData.diagnose.name,
            p10: 1, //门诊收据类型？？？jichengyu 写1
            p11: 100000.00,
            page1: chargeItems
        };

        let seqNum = this.processid + this.sequenceNumber;

        this.heilongjiangprocessservice.preSettle(seqNum, request).mergeMap(res => {
            this.preSettleResult = res;
            let actiondata = {
                actionName: 'PreSettleAction',
                submittedOrderData: this.hisData,
                preSettleResult: this.preSettleResult,
                patient: this.patient
            }
            if (res.error != "") {
                return Observable.create(observer => observer.next(res.error))
            }
            else {
                return this.progressservice.action(this.processid, actiondata)
            }
        }).finally(() => {
            abp.ui.clearBusy();
        }).subscribe((res: any) => {
            if (res.state) {
                this.doAction(res);
            }
            else {
                let match = /本医院医保办审批后方可结算/.exec(res);
                let match2 = /预警/.exec(res);
                let actiondata = {};
                if (match != null || match2 != null) {
                    abp.message.error('结算金额超出预警限额，需要主管审批');
                    actiondata = {
                        actionName: 'AlertAction',
                        submittedOrderData: this.hisData,
                        patient: this.patient
                    };
                }
                else {
                    this.message.error(res, '结算失败');
                    actiondata = {
                        actionName: 'RetryableFailAction',
                        operationName: 'preSettle',
                        error: res
                    };
                }
                this.progressservice.action(this.processid, actiondata).finally(() => {
                    abp.ui.clearBusy();
                })
                    .subscribe(res => {
                        this.doAction(res);
                    });
            }
        });
    }

    public goSetting() {
        this.router.navigate(['/process/heilongjiang_setting'], {
            queryParams: {
                canShow: true
            }
        });
    }

    public async settle() {
        this.isLoading = true;
        abp.ui.setBusy();
        var settleReceipt=null;
        var settleError=null;
        var settleReceiptId=null;
        
        try{
            // 查询历史单,看看是否已经结算
            let now = new Date();
            let before = new Date(new Date().setDate((now.getDate() - 14)));
            var queryResult = await this.heilongjiangprocessservice.queryChargeRecords({
                p1: 'AAC003', //查询参保人
                p2: this.patient.p3, //患者姓名
                p3: 1,
                p4: this.datepipe.transform(before, 'yyyyMMdd'),
                p5: this.datepipe.transform(now, 'yyyyMMdd'),
                p6: 1
            }).toPromise();

            if(!queryResult.error) {
                var chargeRecord = queryResult.page1.find((r) => {
                        return r.p3 == this.preSettleResult.p1;
                    });
                if(chargeRecord){
                    settleReceiptId=chargeRecord.p8;
                }
            }

            // local settle
            if(!settleReceiptId){
                let seqNum = this.processid + this.sequenceNumber;
                let request = {
                    p1: this.patient.p7, //ic卡号
                    p2: this.password, //密码
                    p3: this.patient.p1, //个人编号
                    p4: this.preSettleResult.p1 // 医保流水号
                }
                var localSettleResult = await this.heilongjiangprocessservice.charge(seqNum, request).toPromise();
                if(localSettleResult.error)
                    settleError=localSettleResult.error;  
                else
                    settleReceiptId=localSettleResult.page1[0].p1;
            }

            // query settle receipt
            if(!settleError){
                var receipt = await this.heilongjiangprocessservice.queryReceipt({
                    p1: settleReceiptId, // 收据号
                    p4: 0,
                    p5: 1
                }).toPromise();

                if(receipt.error)
                    settleError=receipt.error;
                else
                    settleReceipt=receipt;
            }
        }
        catch(err){
            settleError=err;
        }

        var actionData=null;
        if(settleError){
            abp.notify.error('结算失败,'+settleError);
            actionData={
                actionName: 'RetryableFailAction',
                operationName: 'settle',
                error: settleError
            };
        }else{
            actionData={
                actionName: 'SettleAction',
                receipts: [settleReceipt]
            };
        }
        var newState = await this.progressservice.action(this.processid, actionData).toPromise();
        this.doAction(newState);
        abp.ui.clearBusy();
        this.isLoading = false;
    }

    public queryAlertOrder() {
        let request = {
            p1: this.patient.p1,
            p2: this.patient.p3,
            p3: this.patient.p2,
            p4: this.patient.p7,
            p5: this.hisData.department.name,
            p6: this.hisData.doctor.channelData.name,
        }
        this.heilongjiangprocessservice.queryAlertOrder(request)
            .mergeMap(res => {
                let yibaoSeqNumber = res.result.page1[0].p10;
                let request = {
                    p1: this.patient.p1,
                    p2: yibaoSeqNumber
                }
                return this.deleteAlertOrder(request);
            }).subscribe(res => {
                this.message.error('结算金额超出预警限额，预警单已拒绝')
            });
    }

    public deleteAlertOrder(request: any) {
        return this.heilongjiangprocessservice.deleteAlertOrder(request)
        // .subscribe(res => {
        //     this.message.error('结算金额超出预警限额，预警单已拒绝')
        // })
    }

    public alertSettle() {
        abp.ui.setBusy();
        let chargeRequest = {
            p1: this.patient.p1, //个人编号
            p2: this.preSettleResult.p1 // 医保流水号
        };
        this.heilongjiangprocessservice.alertCharge(chargeRequest, this.processid + this.sequenceNumber).mergeMap(res => {
            let request =
            {
                p1: res.p1, // 收据号
                p4: 0,
                p5: 1
            }
            return this.heilongjiangprocessservice.queryReceipt(request);
        }).mergeMap(res => {
            this.receipts = [res];
            let actiondata = {
                actionName: 'SettleAction',
                receipts: this.receipts
            };
            return this.progressservice.action(this.processid, actiondata);
        })
            .finally(() => {
                abp.ui.clearBusy();
            }).subscribe(res => {
                this.doAction(res);
            })
    };

    public loadAlert() {
        this.heilongjiangprocessservice.queryAlertOrder({
            p1: this.patient.p1,
            p2: this.patient.p3,
            p3: this.patient.p2,
            p4: this.patient.p7,
            // p5: this.hisData.department.name,
            // p6: this.hisData.doctor.channelData.name,
        }).mergeMap(res => {
            this.alertRecord = res.page1[0];
            let request = {
                p1: this.patient.p1,
                p2: this.alertRecord.p10
            };
            return this.heilongjiangprocessservice.getAlertDetail(request);
        }).subscribe(res => {
            this.alertDetail = res.page1;
        });
    };

    public approveAlert() {
        abp.ui.setBusy();
        this.heilongjiangprocessservice.approveAlert({
            p1: this.patient.p1,
            p2: this.alertRecord.p10,
            p3: this.approveReason,
            p4: this.user.channelObjectId,
            p5: this.user.channelObjectName
        }).mergeMap(res => {
            let request =
            {
                p1: this.patient.p1,
                p2: this.alertRecord.p10,
                p3: 1 // //门诊收据类型, jichengyu 写1
            }
            return this.heilongjiangprocessservice.alertPreSettle(request)
        }).mergeMap(res => {
            this.preSettleResult = res;
            let actiondata = {
                actionName: 'AlertPreSettle',
                preSettleResult: this.preSettleResult
            }
            return this.progressservice.action(this.processid, actiondata)
        }).finally(() => {
            abp.ui.clearBusy();
        }).subscribe(res => {
            this.doAction(res);
        });
    };

    public rejectAlert() {
        abp.ui.setBusy();
        this.heilongjiangprocessservice.deleteAlertOrder({
            p1: this.patient.p1,
            p2: this.alertRecord.p10,
        }).mergeMap(res => {
            let request = {
                actionName: 'SettleFailAction',
                error: '医保预警被拒绝'
            };
            return this.progressservice.action(this.processid, request);
        }).finally(() => {
            abp.ui.clearBusy();
        }).subscribe(res => {
            this.doAction(res);
        });
    };

    public goSmState() {
        this.state = 'sm';
        this.subject.next(this.state);
    };

    public printSettlement() {
        this.router.navigate(['./process/heilongjiang_print'], { queryParams: { processId: this.processid } });
    }

    public settleManually() {
        abp.ui.setBusy();

        let now = new Date();
        let before = new Date(new Date().setDate((now.getDate() - 14)));
        this.heilongjiangprocessservice.queryChargeRecords({
            p1: 'AAC003', //查询参保人
            p2: this.smName,
            p3: 1,
            p4: this.datepipe.transform(before, 'yyyyMMdd'),
            p5: this.datepipe.transform(now, 'yyyyMMdd'),
            p6: 1
        }).mergeMap(res => {
            this.smChargeRecords = res.page1;
            let record = this.smChargeRecords.find((r) => {
                return r.p3 == this.preSettleResult.p1;
            });
            if (record != null) {
                return this.heilongjiangprocessservice.queryReceipt({
                    p1: record.p8, // 收据号
                    p4: 0,
                    p5: 1
                }).mergeMap(res => {
                    this.receipts = [res];
                    let request = {
                        actionName: 'SettleManuallyAction',
                        receipts: this.receipts
                    };
                    return this.progressservice.action(this.processid, request);
                })
            } else {
                abp.ui.clearBusy();
                abp.notify.warn('未找到14天内此结算流程的收据,可能未收费成功');
                return Observable.of(null);
            }
        }).finally(() => {
            abp.ui.clearBusy();
        }).subscribe(res => {
            if (res) {
                this.doAction(res);
            }
        });
    };

    public doAction(result: any) {
        this.state = result.state;
        this.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
        // this.progressservice.action(this.processid, actiondata).subscribe(result => {
        //     console.log(result);
        //     this.state = result.result.state;
        //     this.sequenceNumber = result.result.sequenceNumber;
        //     this.subject.next(this.state);
        // })
    }
}
