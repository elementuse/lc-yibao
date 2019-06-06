import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy, QueryRegisteredItemInput, HisServiceProxy } from "@shared/service-proxies/service-proxies";
import { ClientFujianfuzhouProxy } from "./client-fujianfuzhou.proxy";

@Component({
    templateUrl: './process-fujianfuzhou.component.html'
})
export class ProcessFujianfuzhouComponent extends AppComponentBase implements OnInit {
    public channel: string = 'Fujianfuzhou';
    public providers: any;
    public userid: string = '0000';
    public processid: string = '';
    public subject = new BehaviorSubject('');
    public hisData: hisDataModel;
    public state: string;
    public failedMessage: string;
    public patient: any;
    public password: string;
    public baseParams: any = {};
    public registerData: any;
    public registerDate: any;
    public settleResult: any;
    public isPresettle: boolean = false;

    constructor(
        public injector: Injector,
        private commonService: CommonProcessService,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private fujianfuzhouprocessservice: ClientFujianfuzhouProxy,
        protected activatedRoute: ActivatedRoute
    ) {
        super(injector);
        this.activatedRoute.queryParams.subscribe(
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
        };

        //接受者订阅消息
        this.subject.subscribe({
            next: v => {
                if (this.state == "SettleFailed") {
                    this.processService
                        .getDataStoreItem(this.baseParams.processId, "error")
                        .subscribe((result: any) => {
                            this.failedMessage = Object.keys(result).map(e => result[e]).join('');
                        });
                }
            }
        });
    }

    ngOnInit(): void {
        this.getRegisteredItems();
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
                    //this.notify.warn(
                    //    `找不到当前操作员信息，请在医保平台注册用户${
                    //    this.userid
                    //    }`
                    //);
                    operator = {
                        channelObjectId: "0000",
                        channelObjectName: "默认用户"
                    };
                }
                //this.baseParams.opratorCode = operator.channelObjectId;
                //this.baseParams.opratorName = operator.channelObjectName;

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

                    //if (item.chargeItem.IsYibaoItem)
                    //{
                    //    if (item.chargeItem.channelData.price * 1 != item.chargeItem.price) {
                    //        abp.message.error("E看牙收费项价格和医保中心收费项价格不一致!", "结算终止");
                    //        fail("E看牙收费项价格和医保中心收费项价格不一致!");
                    //    }
                    //}
                });
            });

            this.hisData = tempdata;
            
            this.state = res.state;
            this.baseParams.sequenceNumber = res.sequenceNumber;
            this.failedMessage = res.dataStore.error;
            this.patient = res.dataStore.patient ? res.dataStore.patient : this.patient;
            this.registerData = res.dataStore.registerData ? res.dataStore.registerData : this.registerData;
            this.registerDate = res.dataStore.registerDate ? res.dataStore.registerDate : this.registerDate;
            this.settleResult = res.dataStore.settleResult ? res.dataStore.settleResult : this.settleResult;

        })
    }

    public readCard(): any {
        abp.ui.setBusy();
        let identityCode = '';
        let readcardParams = this.baseParams;
        Object.assign(readcardParams, { valid0: identityCode });

        this.fujianfuzhouprocessservice.fujianfuzhouReadCard().subscribe(res => {

            this.patient = res;

            if (!res.valid0)  {
                abp.notify.error("当前医保卡不能挂号," + res.error);
            }

            abp.ui.clearBusy();
        });
    }

    public register(): any {
        abp.ui.setBusy();
        let registerParams = {
            cardno: this.patient.cardno,        //医保IC卡号或社保IC卡号
            ghksmc: this.hisData.department.name,   //挂号科室名称
            ghfy00: 0,                   //挂号费用
            ksbm00: this.hisData.department.id, //科室编码
            yy_ghlsh0: this.processid    //医院挂号流水号
        };

        this.fujianfuzhouprocessservice.fujianfuzhouregister(registerParams).mergeMap(res => {
            this.registerData = res;
            let request = {
                actionName: 'RegisterAction',
                registerData: this.registerData,
                patient: this.patient
            };
            return this.processService.action(this.processid, request);
        }).subscribe(res => {
            let dt = new Date();
            this.registerDate = dt.getFullYear() + "" + (dt.getMonth() + 1) + "" + dt.getDate();
            this.doAction(res);
            abp.ui.clearBusy();
        });
    }

    public preSettle(): any {
        abp.ui.setBusy();

        //判断挂号是否是当天的   否则提示重新挂号
        //let dt = new Date();

        //var dat = dt.getFullYear() + "" + (dt.getMonth() + 1) + "" + dt.getDate();

        //if (dat != this.registerDate) {
        //    this.notify.error('当天未挂号,请作废此单后重新挂号!');
        //    abp.ui.clearBusy();
        //    return;
        //}

        let cno = {
            cardno: this.patient.cardno                                      //医保IC卡号或社保IC卡号
        };

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        this.fujianfuzhouprocessservice.fujianfuzhoupresettlementreadcard(cno).subscribe(res =>
        {
            if (res.xming0 == null || res.xming0 == '') {
                abp.notify.error("读卡错误：");
                abp.ui.clearBusy();
            } else {
                
                let chargeItems = [];
                let categoryTotals = {};
                this.hisData.chargeItemForms.forEach(form => {
                    form.chargeItems.forEach(item => {
                        if (item.insurance) {
                            chargeItems.push({
                                code: item.chargeItem.channelData.id,                                      //编号
                                isYibao: 'Y',         //是否医保项目
                                invoiceName: item.chargeItem.channelData.chargeItemCategory,     //发票项目名称
                                name: item.chargeItem.name,                                      //名称
                                spec: item.chargeItem.channelData.drugSpec,          //规格
                                unit: item.chargeItem.unit,                                 //单位
                                price: item.chargeItem.price,                     //单价
                                count: item.amount,                               //数量
                                totalAmount: item.total,                              //总金额
                                doctorName: this.hisData.doctor.name,                                       //医生姓名
                                dosage: 9999,                                        //药品用量
                                useDays: '无',              //用药天数
                                useFrequency: 0,              //使用频率
                                doctorCardNo: doctor.channelObjectId             //医生证件号码
                            });

                            if (categoryTotals[item.chargeItem.channelData.chargeItemCategory] != undefined) {
                                categoryTotals[item.chargeItem.channelData.chargeItemCategory] = categoryTotals[item.chargeItem.channelData.chargeItemCategory] + item.total;
                            } else {
                                categoryTotals[item.chargeItem.channelData.chargeItemCategory] = item.total;
                            }
                        }
                    });
                });

                let settlementParams = {
                    cardno: this.patient.cardno,                                      //医保IC卡号或社保IC卡号
                    mzlsh0: res.mzlsh0.split(';')[0],                                             //门诊流水号
                    bqbm00: '',                                               //病种编码
                    cfxms0: chargeItems.length,                                             //收费项目数
                    yy_ghlsh0: this.registerData.ghlsh0,                                             //医院挂号流水号 (挂号后医保中心返回的号码)
                    yy_djlsh0: this.processid,                                                //医院单据流水号
                    yb0000: categoryTotals,                             //医保发票项目
                    ybgr00: '',                       //医保个人发票项目
                    tsxm00: '',                                                //医保特殊发票项目
                    fyb000: '', //非医保发票项目
                    mzsfsmx: chargeItems                         //处方明细信息
                };

                this.fujianfuzhouprocessservice.fujianfuzhoupresettlement(settlementParams)
                    .subscribe(res => {
                        this.settleResult = res;
                        this.isPresettle = true;
                        abp.ui.clearBusy();

                    //let actiondata = {
                    //    actionName: 'PreSettleAction',
                    //    hisData: this.hisData,
                    //    settleResult: this.settleResult
                    //};
                    //return this.processService.action(this.processid, actiondata);
                }
            )
            }
        }
        );
        
    }


    settle(): any {
        abp.ui.setBusy();

        //判断挂号是否是当天的   否则提示重新挂号
        //let dt = new Date();

        //var dat = dt.getFullYear() + "" + (dt.getMonth() + 1) + "" + dt.getDate();

        //if (dat != this.registerDate) {
        //    this.notify.error('当天未挂号,请作废此单后重新挂号!');
        //    abp.ui.clearBusy();
        //    return;
        //}

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        let chargeItems = [];
        let categoryTotals = {};
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        code: item.chargeItem.channelData.id,                                      //编号
                        isYibao: item.chargeItem.IsYibaoItem ? 'Y' : 'N',         //是否医保项目
                        invoiceName: item.chargeItem.channelData.chargeItemCategory,     //发票项目名称
                        name: item.chargeItem.name,                                      //名称
                        spec: item.chargeItem.channelData.drugSpec == "" ? "无" : item.chargeItem.channelData.drugSpec,          //规格
                        unit: item.chargeItem.unit,                                 //单位
                        price: item.chargeItem.price,                     //单价
                        count: item.amount,                               //数量
                        totalAmount: item.total,                              //总金额
                        doctorName: this.hisData.doctor.name,                                       //医生姓名
                        dosage: 9999,                                        //药品用量
                        useDays: '无',              //用药天数
                        useFrequency: 0,              //使用频率
                        doctorCardNo: doctor.channelObjectId             //医生证件号码
                    });

                    if (categoryTotals[item.chargeItem.channelData.chargeItemCategory] != undefined) {
                        categoryTotals[item.chargeItem.channelData.chargeItemCategory] = categoryTotals[item.chargeItem.channelData.chargeItemCategory] + item.total;
                    } else {
                        categoryTotals[item.chargeItem.channelData.chargeItemCategory] = item.total;
                    }
                }
            });
        });

        let cno = {
            cardno: this.patient.cardno                                      //医保IC卡号或社保IC卡号
        };

        this.fujianfuzhouprocessservice.fujianfuzhoupresettlementreadcard(cno).subscribe(res =>
        {
            if (!res.success) {
                abp.notify.error("读卡错误：" + res.error);
                abp.ui.clearBusy();
            } else {
                let settlementParams = {
                    cardno: this.patient.cardno,                                      //医保IC卡号或社保IC卡号
                    mzlsh0: res.mzlsh0.split(';')[0],                                             //门诊流水号
                    bqbm00: '',                                               //病种编码
                    cfxms0: chargeItems.length,                                             //收费项目数
                    yy_ghlsh0: this.registerData.ghlsh0,                                             //医院挂号流水号 (挂号后医保中心返回的号码)
                    yy_djlsh0: this.processid,                                                //医院单据流水号
                    yb0000: categoryTotals,                             //医保发票项目
                    ybgr00: '',                       //医保个人发票项目
                    tsxm00: '',                                                //医保特殊发票项目
                    fyb000: '', //非医保发票项目
                    mzsfmx: chargeItems                         //处方明细信息
                };

                this.fujianfuzhouprocessservice.fujianfuzhousettlement(settlementParams, this.hisData.diagnose.id, this.hisData.diagnose.name).mergeMap(res => {
                    this.settleResult = res;

                    let actiondata = {
                        actionName: 'SettleAction',
                        hisData: this.hisData,
                        settleResult: this.settleResult
                    };

                    if (!res.success) {
                        abp.notify.error("收费错误:" + res.error);
                        abp.ui.clearBusy();
                    } else {
                        return this.processService.action(this.processid, actiondata);
                    }

                }).subscribe((res: any) => {
                    abp.ui.clearBusy();
                    this.message.success("结算完成");
                    this.doAction(res);
                });
            }
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


    public doAction(result: any): Observable<any> {
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
        return Observable.of(null);
    }

    //public doAction(result: any): any {
    //    console.log(result);
    //    this.state = result.state;
    //    this.baseParams.sequenceNumber = result.sequenceNumber;
    //    this.subject.next(this.state);
    //}
}
