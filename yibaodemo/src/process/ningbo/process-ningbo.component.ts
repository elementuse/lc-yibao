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
import { ClientNingboProxy } from "./client-ningbo.proxy";

@Component({
    templateUrl: './process-ningbo.component.html'
})
export class ProcessNingboComponent extends AppComponentBase implements OnInit {
    public channel: string = 'Ningbo';
    public providers: any;
    public userid: string = '0000';
    public processid: string = '';
    public subject = new BehaviorSubject('');
    public hisData: hisDataModel;
    public state: string;
    public failedMessage: string;
    public patient: any;
    public baseParams: any = {};
    public registerData: any;
    public settleResult: any;
    public isPresettle: boolean = false;
    public s_menzhenhao: string;

    constructor(
        public injector: Injector,
        private commonService: CommonProcessService,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private ningboprocessservice: ClientNingboProxy,
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
                        Object.assign(item, { insurance: true });
                    } else {
                        Object.assign(item, { insurance: false });
                    }

                    if (item.chargeItem.IsYibaoItem) {
                        if (item.chargeItem.channelData.price * 1 != item.chargeItem.price) {
                            abp.message.error("E看牙收费项价格和医保中心收费项价格不一致!", "结算终止");
                            fail("E看牙收费项价格和医保中心收费项价格不一致!");
                        }
                    }
                });
            });

            this.hisData = tempdata;

            this.state = res.state;
            this.baseParams.sequenceNumber = res.sequenceNumber;
            this.failedMessage = res.dataStore.error;
            this.patient = res.dataStore.patient ? res.dataStore.patient : this.patient;
            this.registerData = res.dataStore.registerData ? res.dataStore.registerData : this.registerData;
            this.settleResult = res.dataStore.settleResult ? res.dataStore.settleResult : this.settleResult;
        })
    }

    //读卡
    public readCard(): any {
        abp.ui.setBusy();
        let identityCode = '';
        Object.assign(this.baseParams, { valid0: identityCode });

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        let readcardParams = {
            cSfrydm: doctor.channelObjectId    //收费人员代码
        };

        this.ningboprocessservice.ReadCard(readcardParams).subscribe(res => {

            this.patient = res;

            if (!res.isSuccess) {
                abp.notify.error("读卡错误," + res.resultMessage);
            }
            abp.ui.clearBusy();
        });
    }

    //挂号
    public register(): any {
        abp.ui.setBusy();

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        this.s_menzhenhao = new Date().getTime().toString();//获取时间戳  用于门诊号

        let registerParams = {
            cghfdm: "NBYB00001",                            //挂号费代码
            cghfje: 0,                                      //挂号费金额
            czlfdm: "NBYB00002",                            //诊疗费代码
            czlfje: 0,                                      //诊疗费金额
            cSfrydm: doctor.channelObjectId,                //收费人员代码
            klb: this.patient.klb,                          //卡类别 
            ksj: this.patient.ksj,                          //读卡器返回字符串
            cJylb: "",                                      //交易类别
            ctsjsbs: "0000",                                //特殊结算标示
            cbtzkbs: "1",                                   // 1普通/2专科 标示
            cKsdm: this.hisData.department.channelData.id,  //科室代码
            menzhenhao: this.s_menzhenhao                   //门诊号
        };

        this.ningboprocessservice.Register(registerParams).mergeMap(res => {
            this.registerData = res;
            let request = {
                actionName: 'RegisterAction',
                registerData: this.registerData,
                patient: this.patient
            };
            return this.processService.action(this.processid, request);
        }).subscribe(res => {
            abp.ui.clearBusy();
            this.doAction(res);
        });
    }

    //预收费
    public preSettle(): any {
        abp.ui.setBusy();

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        var settlementParams = this.BuildSettleData(false);

        this.ningboprocessservice.Presettlement(settlementParams)
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
            );
    }

    //收费
    settle(): any {
        abp.ui.setBusy();

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        if (doctor == null) {
            this.notify.error('请选择医生');
            abp.ui.clearBusy();
            return;
        }

        var settlementParams = this.BuildSettleData(true);

        this.ningboprocessservice.Settlement(settlementParams).mergeMap(res => {
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

    public BuildSettleData(isSettle: boolean): any {

        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });

        let chargeItems = [];
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        ffbh: "00",
                        mxxmbm: item.chargeItem.channelData.id,                 //编号
                        mxxmfl: item.chargeItem.channelData.chargeItemCategory, //项目分类 1：药品；2：材料；3：服务项目；4：自制制剂
                        jjsl: item.amount,                                      //计价数量
                        dj: item.chargeItem.price,                              //单价
                        xzsybz: item.chargeItem.channelData.chargeItemXzbz      //限制标志 0：无要求；1：不符合限用规定；2：符合限用规定
                    });
                }
            });
        });

        let settleParams = {
            cZzysbm: doctor.channelObjectId,                //诊治医生编码
            cZddm1: this.hisData.diagnose.channelData.id,   //诊断代码1
            cZddm2: "",                                     //诊断代码2
            cZddm3: "",                                     //诊断代码3
            cCfh: "",                                       //处方号  可为空
            cJzbh: this.registerData.jzbh,                  //就诊编号  挂号就诊编号?  20个长度
            cMxzdh: this.registerData.cMxzdh,               //明细账单号 挂号明细账单号?  20个长度
            cMxtjsxh: "0001",                               //明细提交顺序号
            cYlfymxxht: chargeItems,                        //医疗费用明细循环体(提交)
            cJsqqbs: isSettle ? "1" : "0",                  //结算请求标示  0:不结算  1:结算
            cbcfymxb: this.hisData.total,                   //本次费用明细包的费用总额
            cQcmxtjsxh: "",                                 //前次明细提交顺序号  首次为空
            cBjsbs: "0",                                    //补结算标识 	0：正常交易；1：补结算交易
            cYjsjylsh: "",                                  //原结算交易流水号	缺省为空；补结算时必须填写
            cJylb: "",                                      //交易结算类别
            ctsjsbs: "0000",                                //特殊结算标示  缺省为“0000”需要特殊结算时填写相应的代码
            cbtzkbs: "1",                                   //普通专科标示  1：普通；2：专科
            cKsdm: this.hisData.department.channelData.id,  //科室代码
            menzhenhao: this.s_menzhenhao,                  //门诊号
            cSfrydm: doctor.channelObjectId,                //收费人员代码
            klb: "21",                                      //卡类别     默认社保卡
            ksj: this.patient.ksj                           //读卡器返回的字符串
        };

        return settleParams;
    }

    public print(): any {
        window.print();
    }

    fail(msg: string): void {
        this.message.confirm(
            msg,
            (isConfirmed) => {
                if (isConfirmed) {
                    abp.ui.setBusy();

                    let actiondata = {
                        actionName: 'SettleFailAction',
                        error: msg
                    };
                    this.processService.action(this.processid, actiondata).subscribe(res => {
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
}
