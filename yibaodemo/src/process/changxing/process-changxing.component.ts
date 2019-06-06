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
import { ClientChangxingProxy } from "./client-changxing.proxy";
import { ConstsChangxing } from "./consts-changxing";

@Component({
    templateUrl: "./process-changxing.component.html",
    styleUrls: ['./process-changxing.component.css']
})
export class ProcessChangxingComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};
    
    public channel: string = "Changxing";
    public cardInfo: any;
    public patient: any;
    public hisData: hisDataModel;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    public diagnoses: any;
    public selectedDiagnoses: any[];
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = ConstsChangxing.yibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ClientChangxingProxy,
        protected activatedRoute: ActivatedRoute,
        private datePipe: DatePipe
    ) {
        super(injector);

        this.activatedRoute.queryParams.subscribe((queryParams: any) => {
            this.processid = queryParams.processId;
        });

        this.baseParams = {
            processId: this.processid,
            sequenceNumber: 0,
            hospitalCode: abp.setting.get("Changxing.HospitalCode.Tenant"),
            p3: "1",
            p4: ""
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
        queryRegisteredItemInput.objectType = "Diagnose";
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.diagnoses = res.items;

                return this.getInternalStateWithData();
            });
    }

    public getInternalStateWithData() {
        this.commonservice
            .getInternalStateWithData(this.processid)
            .subscribe((result: any) => {
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

                let selectedIds = [];
                res.orderData.diagnoses.forEach(item => {
                    selectedIds.push(item.id);
                });
                this.selectedDiagnoses = selectedIds;

                this.state = res.state;
                this.baseParams.sequenceNumber = res.sequenceNumber;
                this.cardInfo = res.dataStore.cardInfo;
                this.patient = res.dataStore.patient;
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

    public getCardInfo(cardinfo): string {
        if (!cardinfo) return '';

        return  cardinfo.cardType + '|' +
                cardinfo.cardNumber + '|' +
                cardinfo.personalNumber + '|' +
                cardinfo.areaCode + '|' +
                cardinfo.machineType + '|' +
                cardinfo.machineNo + '|' +
                cardinfo.dllVersion + '|' +
                cardinfo.libVersion + '|' +
                cardinfo.termNo + ',' +
                cardinfo.psamNo;
    }

    // 读卡
    public readcard(): any {
        abp.ui.setBusy();

        this.yibaoservice
            .readcard(this.baseParams)
            .mergeMap(res => {
                this.cardInfo = res;
                if (this.cardInfo.cardType != 3) {
                    this.notify.warn('卡类型不支持');
                    return Observable.throwError("卡类型不支持");
                }

                let hospitalCode = abp.setting.get('Changxing.HospitalCode.Tenant');
                let patientParams = _.extend({
                    p1: "1",
                    p2: this.getCardInfo(this.cardInfo),
                    p5: "1",
                    p6: this.cardInfo.cardType,
                    p7: "0",
                    p8: "0",
                    p9: this.cardInfo.areaCode,
                    p10: hospitalCode.substr(0, 6)
                }, this.baseParams);
                return this.yibaoservice.fetchpatientinfo(patientParams);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.patient = res;
                if (this.patient) {
                    this.patient.allow = parseInt(this.patient.p6.substring(0,6)+this.patient.p6.charAt(12)) == 0;
                    if (!this.patient.allow) {
                        this.notify.warn('门诊业务不支持:' + this.patient.p7);
                    }
                }
            });
    }

    public getSettleParam(): any {
        let settleDiagnoses = [];
        for(let i = 0; i < this.selectedDiagnoses.length; i++) {
            let diagnoseId = this.selectedDiagnoses[i];
            let diagnoseItem = this.diagnoses.find(function(o){
                return o.channelObjectId == diagnoseId;
            });
            settleDiagnoses.push({
                p1: diagnoseId,
                p2: diagnoseItem ? diagnoseItem.channelObjectName : ''
            });
        }

        let nowstr = this.datePipe.transform(new Date(), "yyyy-MM-dd hh:mm:ss");
        let settleParams = _.extend({
            p1: "1",
            p2: this.getCardInfo(this.cardInfo),
            p5: "1",
            p6: "0",
            p7: this.cardInfo.areaCode,
            p8: this.cardInfo.areaCode,
            p9: "13", //普通门诊
            p10: "0",
            p13: this.processid.substring(0, 20),
            p14: settleDiagnoses[0].p1,
            p15: settleDiagnoses[0].p2,
            p17: nowstr,
            p18: this.hisData.department.id,
            p19: this.hisData.department.name,
            p20: this.hisData.doctor.id,
            p21: this.hisData.doctor.name,
            p22: this.hisData.operator.id,
            p25: "0",
            p26: "0",
            p27: "0",
            p31: "0",
            p32: this.cardInfo.psamNo
        }, this.baseParams);

        let chargeItems = [];
        let no = 0;
        let sum = 0;
        let dept = this.hisData.department;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    no++;
                    sum += item.total;
                    chargeItems.push({
                        p1: no + "", //明细序号
                        p2: item.chargeItem.channelData.chargeItemType, //药品诊疗类型
                        p3: item.chargeItem.channelData.chargeItemLevel, //收费项目等级
                        p4: item.chargeItem.channelData.id, //项目统一编号
                        p5: item.chargeItem.channelData.name, //项目统一名称
                        p6: nowstr, //项目发生时间
                        p7: item.chargeItem.id, //项目医院编号
                        p8: item.chargeItem.name, //项目医院端名称
                        p9: item.chargeItem.channelData.drugSpec, //规格
                        p10: item.chargeItem.channelData.drugType, //剂型
                        p11: item.chargeItem.channelData.drugUnit, //单位
                        p17: item.chargeItem.price, //单价
                        p18: item.amount, //数量
                        p19: item.total, //项目总金额
                        p24: dept.id, //开单科室编码
                        p25: dept.name, //开单科室名称
                        p26: dept.id, //执行科室编码
                        p27: dept.name //执行科室名称
                    });
                }
            });
        });

        settleParams.p24 = sum.toFixed(2);
        settleParams.p28 = chargeItems.length;
        settleParams.p29 = chargeItems;
        settleDiagnoses.shift();
        settleParams.p35 = settleDiagnoses;

        return settleParams;
    }

    public preSettle(): any {
        if (this.selectedDiagnoses.length == 0) {
            this.notify.warn('请选择诊断！');
            return;
        }

        abp.ui.setBusy();

        return this.yibaoservice
            .presettle(this.getSettleParam())
            .mergeMap(res => {
                this.settleResult = res;
                let request = {
                    actionName: "PreSettleAction",
                    cardInfo: this.cardInfo,
                    patient: this.patient,
                    hisData: this.hisData,
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, request);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.doAction(res);
            });
    }

    public async settle(): Promise<any> {
        abp.ui.setBusy();

        try {
            let queryResult = await this.querySettle();
            if (queryResult.p6 == "2") {    //已退费
                return await this.failAction("已退费");
            }

            this.settleResult = {
                p6: queryResult.p8,
                p11: queryResult.p9
            };
            if (queryResult.p6 == "9") {    //无记录
                this.settleResult = await this.doSettle();
                queryResult.p6 = "0";
            }

            if (queryResult.p6 == "0" && this.cardInfo.areaCode != "330522") {    //已结算&&异地
                await this.confirmSettle(queryResult.p8);
            }

            let actiondata = {
                actionName: "SettleAction",
                settleResult: this.settleResult
            };
            let res = await this.processService.action(this.processid, actiondata).toPromise();
            this.message.success("结算完成");
            return this.doAction(res).toPromise();
        }
        catch (error) {
            console.log(error);
        }
        finally {
            abp.ui.clearBusy();
        }
    }

    async querySettle(): Promise<any> {
        let queryParams = _.extend({
            p1: "0",
            p2: "",
            p5: "9203",
            p6: this.processid.substring(0, 20)
        }, this.baseParams);
        return this.yibaoservice
            .querysettle(queryParams)
            .toPromise();
    }

    async doSettle(): Promise<any> {
        return this.yibaoservice
            .settle(this.getSettleParam())
            .toPromise();
    }

    async confirmSettle(no: string): Promise<any> {
        let confirmParams = _.extend({
            p1: "0",
            p2: "",
            p5: no,
            p6: "0",
            p7: "0"
        }, this.baseParams);
        return this.yibaoservice
            .confirmsettle(confirmParams)
            .toPromise();
    }

    public print(): any {
        this.printing = true;
        setTimeout(() => {
            window.print();
            this.printing = false;
        }, 200);
    }

    async fail(msg: string): Promise<any> {
        this.message.confirm(msg, isConfirmed => {
            if (isConfirmed) {
                abp.ui.setBusy();

                try {
                    this.failAction(msg);
                }
                catch (error) {
                    console.log(error);
                }
                finally {
                    abp.ui.clearBusy();
                }
            }
        });
    }

    async failAction(msg: string): Promise<any> {
        let actiondata = {
            actionName: "SettleFailAction",
            error: msg
        };
        return this.processService
        .action(this.processid, actiondata)
        .mergeMap(res => {
            return this.doAction(res);
        }).toPromise();
    }
}
