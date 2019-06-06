import { Component, OnInit, Injector, ViewChild } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy, QueryRegisteredItemInput, HisServiceProxy } from "@shared/service-proxies/service-proxies";
import { ClientTaizhouProxy } from "./client-taizhou.proxy";
import { ConstsTaizhou } from "./consts-taizhou";
import * as moment from "moment";
import { AdviceTaizhouComponent } from "./advice-taizhou.component";

@Component({
    templateUrl: "./process-taizhou.component.html",
    styleUrls: ['./process-taizhou.component.css']
})
export class ProcessTaizhouComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};
    
    public channel: string = "Taizhou";
    public patient: any;
    public hisData: hisDataModel;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    public providers: any;
    public diagnoses: any;
    public selectedDiagnoses: any[];
    public processid: string = "";
    public userid: string = "0000";

    public subject = new BehaviorSubject("");
    public config: any = ConstsTaizhou.yibaoConfig;

    public settleParams: any;

    @ViewChild("adviceTaizhouModal") adviceTaizhouModal: AdviceTaizhouComponent;
    
    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ClientTaizhouProxy,
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
            sequenceNumber: 0,
            hospitalCode: abp.setting.get("Taizhou.HospitalCode.Tenant"),
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
        queryRegisteredItemInput.objectType = "Provider";
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.providers = res.items;

                return this.getInternalStateWithData();
            });
            
        queryRegisteredItemInput.objectType = "Diagnose";
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.diagnoses = res.items;
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

    public getWisdomHeader(patient) {
        let sbkh = '';
        let sbksbh = '';

        let arr1 = patient.p5.split('|');
        let arr2 = patient.p5.split('&');

        let s1 = arr1.length > 1;
        let s2 = arr2.length > 1;

        if (s1 && arr1[0] == '1') {
            sbkh = arr1[2];
            sbksbh = arr1[1];
        }
        if (s1 && arr1[0] == '2') {
            sbkh = arr1[2];
            sbksbh = '';
        }
        if (!s1 && s2) {
            sbkh = arr2[0];
            sbksbh = '';
        }
        if (!s1 && !s2) {
            sbkh = patient.p5;
            sbksbh = '';
        }

        return {
            "yljgdm": abp.setting.get("Taizhou.HospitalCode.Tenant"),
            "yljgxzqh": abp.setting.get("Taizhou.HospitalArea.Tenant"),
            "sbkh": sbkh + '-' + sbksbh,
            "sbksbh": sbksbh,
            "sfzh": patient.p6.p7,
            "cbrxzqh": patient.p6.p10,
            "jzwybh": this.processid.substring(0,20),
            "jysj": moment().format("YYYYMMDD/HHmmss/")
        };
    }

    // 读卡
    public readcard(): any {
        abp.ui.setBusy();

        let fetchpatientinfoParams = _.extend({
            p1: "1",
            p5: "10",
            p6: "0"
        }, this.baseParams);
        this.yibaoservice
            .fetchpatientinfo(fetchpatientinfoParams)
            .finally(() => {
                abp.ui.clearBusy();
            })
            .mergeMap(res => {
                this.patient = res;
                if (!this.patient) return;

                this.patient.allow = parseInt(this.patient.p7[0]+this.patient.p7[1]+this.patient.p7[3]+this.patient.p7[4]) == 0;
                if (!this.patient.allow) {
                    this.notify.warn('门诊业务不支持:' + this.patient.p7);
                    return;
                }

                let remindParams = {
                    "head": this.getWisdomHeader(this.patient),
                    "body": {
                        "sfzh": this.patient.p6.p7
                    }
                };
                return this.yibaoservice.remind(remindParams);
            })
            .subscribe();
    }

    public preSettle(): any {
        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        if (doctor == null) {
            abp.notify.error('请选择医生');
            return;
        }

        if (this.selectedDiagnoses.length == 0) {
            this.notify.warn('请选择诊断！');
            return;
        }

        let advicecheck = true;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance && item.chargeItem.channelData.chargeItemType == '1' && !item.chargeItem.advice) {
                    abp.notify.error(
                        '请填写药品医嘱："' + item.chargeItem.name + '"'
                    );
                    advicecheck = false;
                }
            });
        });
        if (!advicecheck) return;

        abp.ui.setBusy();

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

        this.settleParams = _.extend({
            p1: "1",
            p2: this.patient.p6.p1,
            p5: "12",
            p6: this.processid.substr(0,20),
            p7: moment().format("YYYYMMDD"),
            p8: settleDiagnoses[0].p1,
            p10: settleDiagnoses[0].p2,
            p12: this.userid,
            p13: "1",
            p14: [],
            p15: [],
            p16: [],
            p17: "0"
        }, this.baseParams);

        //收费项目列表
        let chargeItems = [];
        let details = [];
        let thisref = this;
        let nowstr = moment().format("YYYY-MM-DD");
        let no = 0;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    no++;
                    let citem: any = {
                        p1: "001", //单据号码
                        p2: item.chargeItem.channelData.chargeItemType, //药品诊疗类型
                        p3: item.chargeItem.id, //项目医院编号
                        p4: item.chargeItem.name, //项目医院端名称
                        p5: item.chargeItem.channelData.drugUnit, //单位
                        p6: item.chargeItem.channelData.drugSpec, //规格
                        p7: item.chargeItem.channelData.drugType, //剂型
                        p9: item.chargeItem.price, //单价
                        p10: "1",
                        p11: item.amount, //数量
                        p12: item.total, //项目总金额
                        p13: "0",
                        p14: "",
                        p15: "0",
                        p17: doctor.channelObjectId, //医生证书号
                        p18: "0",
                        p27: doctor.channelObjectName, //医生姓名
                    };
                    
                    let ditem: any = {
                        akf005: doctor.channelObjectId,
                        bka609: "1",
                        costs: item.total,
                        deptname: "口腔科|" + doctor.channelObjectName,
                        eligible_amount: item.total,
                        frequency_interval: "61",
                        id: no,
                        item_date: nowstr,
                        item_id: item.chargeItem.channelData.id,
                        item_name: item.chargeItem.channelData.name,
                        item_type: item.chargeItem.channelData.chargeItemType == "1" ? "1" : "0",
                        numbers: item.amount,
                        price: item.chargeItem.price,
                        physicianlevel: "1",
                        specification: item.chargeItem.channelData.drugSpec,
                        usage: "1",
                        usage_days: "0",
                        usage_unit: item.chargeItem.channelData.packUnit,
                        z_physicianap: ""
                    };

                    if (item.chargeItem.channelData.chargeItemType == '1' && item.chargeItem.advice) {
                        citem.p13 = item.chargeItem.advice.yyts; //用药天数
                        citem.p16 = item.chargeItem.advice.yf; //用法
                        citem.p24 = item.chargeItem.advice.yypc; //用药频次
                        citem.p25 = item.chargeItem.advice.mcyl; //每次用量

                        ditem.frequency_interval = item.chargeItem.advice.yypc;
                        ditem.usage = item.chargeItem.advice.mcyl;
                        ditem.usage_days = item.chargeItem.advice.yyts;
                    }
                    chargeItems.push(citem);
                    details.push(ditem);
                }
            });
        });
        this.settleParams.p15 = chargeItems;

        //单据列表
        this.settleParams.p14.push({
            p1: "001",
            p2: "1200",
            p3: "口腔科",
            p4: doctor.channelObjectName,
            p5: chargeItems.length 
        });

        let otherDiagnoses = settleDiagnoses.slice(1);
        this.settleParams.p16 = otherDiagnoses;

        return this.yibaoservice
            .presettle(this.settleParams)
            .mergeMap(res => {
                this.settleResult = {
                    settleNo: "",
                    calculateResultInfo: res.p9
                };

                // 审核，处方主单信息
                // 性别转换
                let gender = '1';
                if (this.patient.p6.p4 == '2') {
                    gender = '0';
                }
                else if(this.patient.p6.p4 == '9') {
                    gender = '-1';
                }
                let main = {
                    benefit_group_id: thisref.patient.p6.p12,
                    benefit_type: "20",
                    bmi_convered_amount: res.p9.p4,
                    ckc892: nowstr,
                    diagnosis_in: settleDiagnoses[0].p1,
                    diagnosis_tother: otherDiagnoses.map(function(o){return o.p1}).join('|'),
                    gender: gender,
                    hospital_id: abp.setting.get("Taizhou.HospitalCode.Tenant"),
                    hospital_level: abp.setting.get("Taizhou.HospitalLevel.Tenant"),
                    hs_diagnosis_in_name: settleDiagnoses[0].p2,
                    hs_diagnosis_out_name: settleDiagnoses[0].p2,
                    hs_number: thisref.processid.substr(0,20),
                    hs_patient_name: thisref.patient.p6.p3,
                    hs_status: "1",
                    hospitaltype: abp.setting.get("Taizhou.HospitalType.Tenant"),
                    id: thisref.processid.substr(0,20),
                    in_date: nowstr,
                    medical_type: "12",
                    out_date: nowstr,
                    patient_birth: moment(thisref.patient.p6.p6, "YYYYMMDD").format("YYYY-MM-DD"),
                    patient_idstr: thisref.patient.p6.p7,
                    settle_date: nowstr,
                    total_cost: res.p9.p1
                };
                let auditParams = {
                    "head": this.getWisdomHeader(this.patient),
                    "body": {
                        "ysbm": doctor.channelObjectId,
                        "packhospital": {
                            "hospitalclaim": main,
                            "hospitalclaimdetailset": details
                        } 
                    }
                };
                return this.yibaoservice.audit(auditParams);
            })
            .mergeMap(res => {
                if (res.code == 3) {
                    return Observable.of(null);
                }

                let request = {
                    actionName: "PreSettleAction",
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
                if (res) {
                    this.doAction(res);
                }
            });
    }

    public settle(): any {
        abp.ui.setBusy();

        return this.yibaoservice
            .settle(this.settleParams)
            .mergeMap(res => {
                this.settleResult = {
                    settleNo: res.p9,
                    calculateResultInfo: res.p10
                };

                let confirmParams = _.extend({
                    p1: "0",
                    p2: this.patient.p6.p1,
                    p5: "30",
                    p6: res.p9,
                    p7: "0",
                    p8: ""
                }, this.baseParams);
                return this.yibaoservice.confirmsettle(confirmParams);
            })
            .mergeMap(res => {
                let request = {
                    actionName: "SettleAction",
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, request);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.message.success("结算完成");
                this.doAction(res);
            });
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
