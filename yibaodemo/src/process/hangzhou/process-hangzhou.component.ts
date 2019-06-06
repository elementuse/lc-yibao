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
import { ClientHangzhouProxy } from "./client-hangzhou.proxy";
import { ConstsHangzhou } from "./consts-hangzhou";
import { AdviceHangzhouComponent } from "./advice-hangzhou.component";

@Component({
    templateUrl: "./process-hangzhou.component.html",
    styleUrls: ['./process-hangzhou.component.css']
})
export class ProcessHangzhouComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};
    
    public channel: string = "Hangzhou";
    public patient: any;
    public hisData: hisDataModel;
    public registerNo: string;
    public uploadData: any[];
    public uploadResult: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;
    public insuranceCheck: boolean = true;
    
    public cardNumber: string = "";
    public identityCode: string = "";

    public providers: any;
    public diagnoses: any;
    public selectedDiagnoses: any[];
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = ConstsHangzhou.yibaoConfig;
    
    @ViewChild("adviceHangzhouModal") adviceHangzhouModal: AdviceHangzhouComponent;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ClientHangzhouProxy,
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
            areaCode: '',
            cardType: 0
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
                            this.insuranceCheck = false;
                        }
                    });
                });
                this.hisData = tempdata;

                this.registerNo = res.orderData.registerNo;
                let selectedIds = [];
                res.orderData.diagnoses.forEach(item => {
                    selectedIds.push(item.id);
                });
                this.selectedDiagnoses = selectedIds;

                this.state = res.state;
                this.baseParams.sequenceNumber = res.sequenceNumber;
                this.patient = res.dataStore.patient;
                this.uploadData = res.dataStore.uploadData;
                this.uploadResult = res.dataStore.uploadResult;
                this.settleResult = res.dataStore.settleResult;
                this.failedMessage = res.dataStore.error;

                if (this.patient) {
                    this.baseParams.areaCode = this.patient.p12;
                    this.baseParams.cardType = this.patient.cardType;
                }
            });
    }

    public doAction(result: any): Observable<any> {
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
        return Observable.of(null);
    }

    // 读卡
    public async readcard(): Promise<any> {
        if (this.baseParams.cardType == 1 && this.cardNumber.length == 0) {
            this.notify.error('请输入证历本号');
            return;
        }

        if (this.baseParams.cardType == 1 && this.identityCode.length != 6) {
            this.notify.error('选择证历本时， 必须输入身份证后六位');
            return;
        }

        abp.ui.setBusy();

        try {
            let cardNo = '';
            if (this.baseParams.cardType == 1) {
                cardNo = this.cardNumber;
            }
            else {
                let readcardResult = await this.yibaoservice.readcard(this.baseParams).toPromise();
                if (readcardResult.cardID.length == 0) {
                    this.notify.error('未读取到卡号');
                    return;
                }

                cardNo = readcardResult.cardID;
                this.baseParams.areaCode = readcardResult.cardID.substring(0, 6);
                this.identityCode = '';
            }

            let fetchpatientinfoParams = Object.assign({}, this.baseParams, {
                p1: cardNo,
                p2: this.datePipe.transform(new Date(), "yyyyMMddHHmmss"),
                p3: this.identityCode
            });
            this.patient = await this.yibaoservice.fetchpatientinfo(fetchpatientinfoParams).toPromise();
            //检查待遇享受状态
            if (this.patient.p17[0] == '1') {
                abp.message.error("该卡已封锁，不可用");
            }
            else if (this.patient.p17[1] == '1') {
                abp.message.error("该卡不能用于门诊收费")
            }
            else {
                this.patient.allow = true;
                this.baseParams.areaCode = this.patient.p12;
            }
        }
        catch (error) {
            console.log(error);
        }
        finally {
            abp.ui.clearBusy();
        }
    }

    // 挂号
    public async register(): Promise<any> {
        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        if (doctor == null) {
            abp.notify.error('请选择医生');
            return;
        }
        
        if (this.selectedDiagnoses.length == 0) {
            abp.notify.error('请选择诊断');
            return;
        }
        let diagnoseId = this.selectedDiagnoses[0];
        let diagnoseItem = this.diagnoses.find(function(o){
            return o.channelObjectId == diagnoseId;
        });

        abp.ui.setBusy();

        try {
            let registerParams = _.extend(
                {
                    p1: this.registerNo, //就诊流水号
                    p2: "11", //医疗类别：普通门诊
                    p3: this.datePipe.transform(new Date(), "yyyyMMddHHmmss"), //就诊时间
                    p4: diagnoseId, //主诊断编码
                    p5: diagnoseItem ? diagnoseItem.channelObjectName : '', //主诊断名称
                    p7: this.hisData.department.id, //科室编号
                    p9: doctor.channelObjectId, //医师编号
                    p10: doctor.channelObjectName, //医师姓名
                    p12: this.patient.p1 //个人编号
                },
                this.baseParams
            );
            try {
                await this.yibaoservice.register(registerParams).toPromise();
            } catch(error) {
                if (typeof error == "string" && error.indexOf('系统中已经存在') > -1) {

                }
                else {
                    Observable.throwError(error);
                }
            }

            this.patient.cardType = this.baseParams.cardType;
            let request = {
                actionName: "RegisterAction",
                registerNo: this.registerNo,
                patient: this.patient
            };
            return this.processService
                .action(this.processid, request)
                .mergeMap(res => {
                    return this.doAction(res);
                })
                .toPromise();
        } catch (error) {
            if (typeof error == "string") {
                abp.message.error(error);
            } else {
                abp.message.error("医保发生错误：服务请求异常");
            }
        } finally {
            abp.ui.clearBusy();
        }
    }

    // 上传
    public async upload(): Promise<any> {
        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        if (doctor == null) {
            abp.notify.error('请选择医生');
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

        try {
            let checkParams = _.extend(
                {
                    p1: this.registerNo //就诊流水号
                },
                this.baseParams
            );
            var checkResult;
            try {
                checkResult = await this.yibaoservice.prescriptioncheck(checkParams).toPromise();
            }
            catch(error){}
            
            if (checkResult && checkResult.p5 > 0) {
                let cancelParams = _.extend(
                    {
                        p1: this.registerNo, //就诊流水号
                        p2: '',
                        p3: this.datePipe.transform(new Date(), "yyyyMMddHHmmss") //经办时间
                    },
                    this.baseParams
                );
                await this.yibaoservice.prescriptioncancel(cancelParams).toPromise();
            }

            let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
            this.uploadData = [];
            let no = 0;
            let thisref = this;
            this.hisData.chargeItemForms.forEach(function(form) {
                form.chargeItems.forEach(function(item) {
                    if (item.insurance) {
                        no++;
                        let citem = {
                            p1: thisref.registerNo, //就诊流水号
                            p2: item.chargeItem.channelData.chargeItemType, //项目类别
                            p3: item.chargeItem.channelData.chargeItemCategory, //收费类别
                            p4: thisref.registerNo, //处方号
                            p5: no, //处方流水号 
                            p6: nowstr, //处方日期
                            p7: item.chargeItem.id, //医院收费项目编码
                            p8: item.chargeItem.name, //医院收费项目名称
                            p9: item.chargeItem.channelData.id, //中心收费项目编码
                            p10: item.chargeItem.price, //单价
                            p11: item.amount, //标准数量
                            p12: item.total, //金额
                            p13: item.chargeItem.channelData.drugType, //剂型
                            p14: item.chargeItem.channelData.drugSpec, //规格
                            p15: item.chargeItem.channelData.drugUnit, //单位
                            p30: doctor.channelObjectId, //医师编号
                            p31: doctor.channelObjectName, //医师姓名
                        };
                        if (item.chargeItem.channelData.chargeItemType == '1' && item.chargeItem.advice) {
                            Object.assign(citem, item.chargeItem.advice);
                        }
                        thisref.uploadData.push(citem);
                    }
                });
            });
            if (this.uploadData.length > 30) {
                abp.notify.error('上传处方不允许超过30条');
                return;
            }
            let uploadParams = _.extend(
                {
                    datas: this.uploadData
                },
                this.baseParams
            );
            this.uploadResult = await this.yibaoservice.prescriptionupload(uploadParams).toPromise();
            let remark = '';
            this.uploadResult.datas.forEach(function(data) {
                if (data.p12.length > 0) {
                    remark += data.p3 + ':' + data.p12;
                }
            });
            if (remark.length > 0) {
                this.notify.warn(remark);
            }

            let request = {
                actionName: "UploadAction",
                UploadedData: this.uploadData,
                uploadedResult: this.uploadResult
            };
            return this.processService
                .action(this.processid, request)
                .mergeMap(res => {
                    return this.doAction(res);
                })
                .toPromise();
        } catch (error) {
            console.log(error);
        } finally {
            abp.ui.clearBusy();
        }
    }

    public async preSettle(): Promise<any> {
        let diagnoseId = this.selectedDiagnoses[0];
        let diagnoseItem = this.diagnoses.find(function(o){
            return o.channelObjectId == diagnoseId;
        });

        abp.ui.setBusy();

        let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        let settlementkParams = _.extend(
            {
                p1: this.registerNo, //就诊流水号
                p2: '', //单据号
                p3: '11', //医疗类别:普通门诊
                p4: nowstr, //结算日期
                p5: nowstr, //出院日期
                p6: '1', //出院原因:治愈
                p7: '0', //结算类别:医院结算
                p8: diagnoseId, //出院疾病编码
                p9: diagnoseItem ? diagnoseItem.channelObjectName : '', //出院疾病名称
                p10: this.selectedDiagnoses.length > 1 ? this.selectedDiagnoses[1] : "", //次要疾病编码1
                p11: this.selectedDiagnoses.length > 2 ? this.selectedDiagnoses[2] : "", //次要疾病编码2
                p29: this.patient.p1 //个人编号
            },
            this.baseParams
        );
        return this.yibaoservice
            .presettlement(settlementkParams)
            .mergeMap(res => {
                this.settleResult = res;
                if ( this.settleResult.p36.length > 0) {
                    this.notify.warn(this.settleResult.p36);
                }
                let request = {
                    actionName: "PreSettleAction",
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

    public settle(): any {
        let diagnoseId = this.selectedDiagnoses[0];
        let diagnoseItem = this.diagnoses.find(function(o){
            return o.channelObjectId == diagnoseId;
        });

        abp.ui.setBusy();

        let nowstr = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        let settlementkParams = _.extend(
            {
                p1: this.registerNo, //就诊流水号
                p2: this.registerNo, //单据号
                p3: '11', //医疗类别:普通门诊
                p4: nowstr, //结算日期
                p5: nowstr, //出院日期
                p6: '1', //出院原因:治愈
                p7: '0', //结算类别:医院结算
                p8: diagnoseId, //出院疾病编码
                p9: diagnoseItem ? diagnoseItem.channelObjectName : '', //出院疾病名称
                p10: this.selectedDiagnoses.length > 1 ? this.selectedDiagnoses[1] : "", //次要疾病编码1
                p11: this.selectedDiagnoses.length > 2 ? this.selectedDiagnoses[2] : "", //次要疾病编码2
                p29: this.patient.p1 //个人编号
            },
            this.baseParams
        );
        return this.yibaoservice
            .settlement(settlementkParams)
            .mergeMap(res => {
                this.settleResult = res;
                if ( this.settleResult.p36.length > 0) {
                    this.notify.warn(this.settleResult.p36);
                }
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
