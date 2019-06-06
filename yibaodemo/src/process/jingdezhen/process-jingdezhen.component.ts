import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { processConsts } from "../shared/processConsts";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import {
    JingdezhenProcessService,
    CommonProcessService
} from "../process.service";
import {
    ProcessServiceProxy,
    QueryRegisteredItemInput,
    HisServiceProxy
} from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./process-jingdezhen.component.html",
    styleUrls: ['./process-jingdezhen.component.css']
})
export class ProcessJingdezhenComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "Jingdezhen";
    public identityCode: string;
    public patient: any;
    public hisData: hisDataModel;
    public registerNo: any;
    public uploadedData: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    public providers: any;
    public userid: string = "0000";
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = processConsts.jingdezhenYibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: JingdezhenProcessService,
        protected activatedRoute: ActivatedRoute,
        private datePipe: DatePipe
    ) {
        super(injector);

        this.activatedRoute.queryParams.subscribe((queryParams: any) => {
            if (queryParams.userId) {
                this.userid = queryParams.userId;
            }
            this.processid = queryParams.processId;
        });

        this.baseParams = {
            processId: this.processid,
            sequenceNumber: 0
        };

        this.subject.subscribe({
            next: (v) => {
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
        this.commonservice
            .getInternalStateWithData(this.processid)
            .subscribe(result => {
                let res = result.result;
                let tempdata = res.orderData;
                tempdata.chargeItemForms.forEach(form => {
                    form.chargeItems.forEach(item => {
                        if (
                            item.chargeItem.channelData != null &&
                            item.chargeItem.channelData.id != null
                        ) {
                            Object.assign(item, { insurance: true });
                        } else {
                            Object.assign(item, { insurance: false });
                        }
                    });
                });
                this.hisData = tempdata;

                this.state = res.state;
                this.baseParams.sequenceNumber = res.sequenceNumber;
                this.patient = res.dataStore.patient;
                this.registerNo = res.dataStore.registerNo;
                this.uploadedData = res.dataStore.uploadedData;
                this.settleResult = res.dataStore.settleResult;
                this.failedMessage = res.dataStore.error;
            });
    }

    public doAction(result: any): Observable<any> {
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
        return Observable.of(null);
    }

    public readcard(): any {
        abp.ui.setBusy();

        let readcardParams = Object.assign({}, this.baseParams, {
            p1: this.identityCode
        });
        this.yibaoservice
            .readCard(readcardParams)
            .mergeMap(res => {
                this.patient = res;
                let checklockParams = _.extend(
                    {
                        p1: this.patient.p1, //个人编号
                        p2: this.patient.p8, //社会保障卡卡号
                        p3: this.datePipe.transform(new Date(), "yyyyMMdd") //判断时间
                    },
                    this.baseParams
                );

                return this.yibaoservice.checkLock(checklockParams);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                if (res.p1 == null || res.p1 === "" || res.p1 === "0") {
                    this.patient.allow = true;
                } else {
                    this.patient.allow = false;
                    abp.notify.error("医保卡不能使用：" + res.p2);
                }
            });
    }

    public register(): any {
        abp.ui.setBusy();

        let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        let registerParams = _.extend(
            {
                p1: nowstr + this.baseParams.processId.substr(-4), //就诊流水号
                p2: "11", //医疗类别：普通门诊
                p3: nowstr, //挂号时间
                p4: this.hisData.diagnose.id, //病种编码
                p5: this.hisData.diagnose.diagnose, //病种名称
                p6: this.hisData.department.id, //科室编号
                p7: this.hisData.department.name, //科室名称
                p9: this.hisData.doctor.id, //医师代码
                p10: this.hisData.doctor.name, //医师姓名
                p11: this.baseParams.opratorName, //经办人
                p12: this.patient.p1, //个人编号
                p18: this.patient.p4, //姓名
                p19: this.patient.p8, //社会保障卡卡号
                p20: 0, //挂号费
                p21: 0 //一般诊疗
            },
            this.baseParams
        );

        this.yibaoservice
            .register(registerParams)
            .mergeMap(() => {
                this.registerNo = registerParams.p1;
                let request = {
                    actionName: "RegisterAction",
                    registerNo: this.registerNo,
                    patient: this.patient
                };
                return this.processService.action(this.processid, request);
            })
            .mergeMap(res => {
                return this.doAction(res);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe();
    }

    public async preSettle(): Promise<any> {
        abp.ui.setBusy();

        try {
            if (this.uploadedData != null) {
                await this.cancelUpload();
                this.uploadedData = null;
            }

            await this.upload();

            return await this.preSettleAction();
        } catch (error) {
            console.log(error);
        } finally {
            abp.ui.clearBusy();
        }
    }

    async preSettleAction(): Promise<any> {
        let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        let settlementParams = _.extend(
            {
                p1: this.registerNo, //就诊流水号
                p2: "0000", //单据号
                p3: "11", //医疗类别，默认普通门诊
                p4: nowstr, //结算日期
                p5: nowstr, //出院日期
                p6: "1", //出院原因，默认治愈
                p7: this.hisData.diagnose.id, //病种编码
                p8: this.hisData.diagnose.diagnose, //病种名称
                p9: "1", //账户使用标志，默认是
                p11: this.baseParams.opratorName, //经办人
                p12: "03", //开发商标志 03其他
                p22: this.patient.p1, //个人编号
                p23: this.patient.p4, //姓名
                p24: this.patient.p8, //社会保障卡卡号
                p25: "0" //胎儿数
            },
            this.baseParams
        );

        return this.yibaoservice
            .presettlement(settlementParams)
            .mergeMap(res => {
                this.settleResult = res;

                let actiondata = {
                    actionName: "PreSettleAction",
                    hisData: this.hisData,
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, actiondata);
            })
            .mergeMap(res => {
                return this.doAction(res);
            })
            .toPromise();
    }

    async cancelUpload(): Promise<any> {
        let prescriptioncancelParams = _.extend(
            {
                p1: this.registerNo, //就诊流水号
                p3: this.baseParams.opratorName, //经办人
                p4: this.patient.p1, //个人编号
                p5: this.patient.p4, //姓名
                p6: this.patient.p8 //社会保障卡卡号
            },
            this.baseParams
        );

        return this.yibaoservice
            .prescriptioncancel(prescriptioncancelParams)
            .toPromise();
    }

    async upload(): Promise<any> {
        let chargeItems = [];
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (item.insurance) {
                    chargeItems.push({
                        p1: this.registerNo, //就诊流水号
                        p2: item.chargeItem.channelData.chargeItemType, //收费项目种类
                        p3: item.chargeItem.channelData.chargeItemCategory, //收费类别
                        p4: this.registerNo, //处方号，用就诊流水号代替
                        p5: this.datePipe.transform(
                            new Date(),
                            "yyyyMMddHHmmss"
                        ), //处方日期
                        p6: item.chargeItem.id, //医院收费项目内码
                        p7: item.chargeItem.channelData.id, //收费项目中心编码
                        p8: item.chargeItem.name, //医院收费项目名称
                        p9: item.chargeItem.price, //单价
                        p10: item.amount, //数量
                        p11: item.total, //金额
                        p12: item.chargeItem.channelData.drugType, //剂型
                        p13: item.chargeItem.channelData.drugSpec, //规格
                        p14: item.chargeItem.channelData.drugDoage, //每次用量
                        p15: item.chargeItem.channelData.drugUseFrequency, //使用频次
                        p16: this.hisData.doctor.id, //医师编码
                        p17: this.hisData.doctor.name, //医师姓名
                        p20: this.hisData.department.id, //科室编号
                        p21: this.hisData.department.name, //科室名称
                        p24: this.baseParams.opratorName, //经办人
                        p25: item.chargeItem.channelData.drugUnit, //药品剂量单位,上传药品时非空
                        p27: this.patient.p1, //个人编号
                        p28: this.patient.p4, //姓名
                        p29: this.patient.p8 //社会保障卡卡号
                    });
                }
            });
        });

        let prescriptionuploadParams = _.extend(
            {
                Datas: chargeItems
            },
            this.baseParams
        );

        return this.yibaoservice
            .prescriptionupload(prescriptionuploadParams)
            .mergeMap(res => {
                this.uploadedData = chargeItems;

                let actiondata = {
                    actionName: "UploadAction",
                    uploadedData: this.uploadedData
                };
                return this.processService.action(this.processid, actiondata);
            })
            .mergeMap(res => {
                return this.doAction(res);
            })
            .toPromise();
    }

    public async settle(): Promise<any> {
        abp.ui.setBusy();

        try
        {
            let queryParams = _.extend(
                {
                    p1: this.registerNo, //就诊流水号
                    p2: "0000", //单据号
                },
                this.baseParams
            );
            this.settleResult = await this.yibaoservice.settlementquery(queryParams).toPromise();

            if (!this.settleResult.isSuccess) {
                let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
                let settlementParams = _.extend(
                    {
                        p1: this.registerNo, //就诊流水号
                        p2: "0000", //单据号
                        p3: "11", //医疗类别，默认普通门诊
                        p4: nowstr, //结算日期
                        p5: nowstr, //出院日期
                        p6: "1", //出院原因，默认治愈
                        p7: this.hisData.diagnose.id, //病种编码
                        p8: this.hisData.diagnose.diagnose, //病种名称
                        p9: "1", //账户使用标志，默认是
                        p11: this.baseParams.opratorName, //经办人
                        p12: "03", //开发商标志 03其他
                        p22: this.patient.p1, //个人编号
                        p23: this.patient.p4, //姓名
                        p24: this.patient.p8, //社会保障卡卡号
                        p25: "0" //胎儿数
                    },
                    this.baseParams
                );
                this.settleResult = await this.yibaoservice.settlement(settlementParams).toPromise();
            }

            let actiondata = {
                actionName: "SettleAction",
                settleResult: this.settleResult
            };
            let actionResult = await this.processService.action(this.processid, actiondata).toPromise();
            this.doAction(actionResult);
            this.message.success("结算完成");
        } catch (error) {
            console.log(error);
        } finally {
            abp.ui.clearBusy();
        }
    }

    public print(): any {
        this.printing = true;
        setTimeout(() => {
            window.print();
            this.printing = false;
        }, 200);
    }

    fail(msg: string): void {
        this.message.confirm(msg, isConfirmed => {
            if (isConfirmed) {
                abp.ui.setBusy();

                let actiondata = {
                    actionName: "SettleFailAction",
                    error: msg
                };

                this.processService
                    .action(this.processid, actiondata)
                    .finally(() => {
                        abp.ui.clearBusy();
                    })
                    .subscribe(res => {
                        this.doAction(res);
                    });
            }
        });
    }
}
