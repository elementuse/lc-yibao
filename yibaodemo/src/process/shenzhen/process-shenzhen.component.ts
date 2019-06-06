import { Component, OnInit, Injector, ViewChild } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { processConsts } from "../shared/processConsts";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import {
    CommonProcessService,
    ShenzhenYibaoService,
    ShenzhenWisdomService
} from "../process.service";
import {
    ProcessServiceProxy,
    QueryRegisteredItemInput,
    HisServiceProxy
} from "@shared/service-proxies/service-proxies";
import { AddAdviceComponent } from "./addadvice-modal.component";

@Component({
    templateUrl: "./process-shenzhen.component.html",
    styleUrls: ['./process-shenzhen.component.css']
})
export class ProcessShenzhenComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "ShenzhenYibao";
    public password: string;
    public patient: any;
    public doctor: any;
    public hisData: hisDataModel;
    public registerNo: any;
    public jiesuanNo: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    public providers: any;
    public diagnoses: any;
    public selectedDiagnoses: any[];
    public userid: string = "0000";
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = processConsts.shenzhenYibaoConfig;
    private totalAmount = 0;

    @ViewChild("addAdviceModal") addAdviceModal: AddAdviceComponent;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ShenzhenYibaoService,
        private wisdomservice: ShenzhenWisdomService,
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
            hospitalCode: abp.setting.get("Shenzhen.HospitalCode.Tenant")
        };
        
        //接受者订阅消息
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
                this.baseParams.operatorCode = operator.channelObjectId;
                this.baseParams.operatorName = operator.channelObjectName;

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

                this.registerNo = res.orderData.registerNo;
                let selectedIds = [];
                res.orderData.diagnoses.forEach(item => {
                    selectedIds.push(item.id);
                });
                this.selectedDiagnoses = selectedIds;

                this.doctor = this.providers.find(o => {
                    return o.hisObjectId == this.hisData.doctor.id
                });

                this.state = res.state;
                this.baseParams.sequenceNumber = res.sequenceNumber;
                this.patient = res.dataStore.patient;
                this.jiesuanNo = res.dataStore.jiesuanNo;
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

    // 获取结算业务序列号
    // type: 1为挂号  2为结算
    getJsxlh(type) {
        return (
            this.baseParams.hospitalCode +
            this.datePipe.transform(new Date(), "yyyyMMdd") +
            this.baseParams.processId.slice(-6) +
            type
        );
    }

    // 读卡
    public readcard(): any {
        abp.ui.setBusy();

        let readcardParams = Object.assign({}, this.baseParams, {
            bzz269: this.password
        });
        this.yibaoservice
            .xx001(readcardParams)
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.patient = res;
            });
    }

    // 挂号
    public register(): any {
        this.doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        if (this.doctor == null) {
            abp.notify.error('请选择医生');
            return;
        }

        abp.ui.setBusy();

        let registerParams = _.extend(
            {
                akc190: this.registerNo, //门诊流水号
                bzz269: this.password, //密码
                aka130: "11", //医疗类别:普通门诊
                akf001: "1200", //科室编号:口腔科
                bkc368: "1", //挂号类别:普通
                aka120: this.selectedDiagnoses.length > 0 ? this.selectedDiagnoses[0] : "", //主疾病编码
                akc188: this.selectedDiagnoses.length > 1 ? this.selectedDiagnoses[1] : "", //次要疾病编码1
                akc189: this.selectedDiagnoses.length > 2 ? this.selectedDiagnoses[2] : "", //次要疾病编码2
                bke384: this.getJsxlh(1), //医药机构结算业务序列号
                akc264: 0, //医疗费总额
                listsize: 0, //发送记录数
                inputlist: [] //发送的数据集消息
            },
            this.baseParams
        );

        this.yibaoservice
            .mz002(registerParams)
            .mergeMap(res => {
                let request = {
                    actionName: "RegisterAction",
                    registerNo: this.registerNo,
                    patient: this.patient
                };
                return this.processService.action(this.processid, request);
            })
            .mergeMap(res => {
                return this.doAction(res);

                // 智慧医保未上线，暂时关闭
                // this.doAction(res);

                // let remindParams = {
                //     operate_person_code: this.baseParams.operatorCode,
                //     operate_person_name: this.baseParams.operatorName,
                //     tran_serial_no:
                //         this.baseParams.hospitalCode +
                //         this.datePipe.transform(new Date(), "yyyyMMdd") +
                //         this.baseParams.processId.slice(-10), //交易流水号
                //     visit_no: this.registerNo, //门诊挂号号
                //     patient_evidence_type: "01", //凭证类型。默认01，社会保障卡号
                //     card_no: this.patient.aac999, //个人电脑编号
                //     medical_dept_code: "1200", //科室编码
                //     medical_dept_name: "口腔科", //科室名称
                //     visit_type: "2", //就诊类型（2门诊）
                //     doctor_code: this.doctor.channelObjectId, //医师编号
                //     doctor_name: this.doctor.channelObjectName, //医师姓名
                //     pc_no: this.patient.aac999, //个人电脑编号
                //     patient_name: this.patient.aac003, //姓名
                //     sex: this.patient.aac004, //性别
                //     age: this.patient.bae093, //年龄
                //     birth_date: this.patient.aac006, //出生日期
                //     insurance_type: "1" //险种类型,暂时使用老医保接口数据
                // };
                // return this.wisdomservice.remind(remindParams);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                // 智慧医保未上线，暂时关闭
                // this.openWisdomWin(res);
            });
    }

    public async preSettle(): Promise<any> {
        // 智慧医保未上线，暂时关闭
        // let advicecheck = true;
        // this.hisData.chargeItemForms.forEach(function(form) {
        //     form.chargeItems.forEach(function(item) {
        //         if (item.insurance && item.chargeItem.channelData.chargeItemType == '1' && !item.chargeItem.advice) {
        //             abp.notify.error(
        //                 '请填写药品医嘱："' + item.chargeItem.name + '"'
        //             );
        //             advicecheck = false;
        //         }
        //     });
        // });
        // if (!advicecheck) return;

        abp.ui.setBusy();

        try {
            // 智慧医保未上线，暂时关闭
            // let auditResult = await this.audit();
            // if (auditResult.is_open_window == "1") {
            //     return this.openWisdomWin(auditResult);
            // }
            
            let queryResult = await this.queryUpload();
            if (queryResult.totalsize > 0) {
                await this.cancelUpload();
            }

            await this.upload();

            return await this.preSettleAction();
        }
        catch (error) {
            console.log(error);
        }
        finally {
            abp.ui.clearBusy();
        }
    }

    async audit(): Promise<any> {
        let serialno =
            this.baseParams.hospitalCode +
            this.datePipe.transform(new Date(), "yyyyMMdd") +
            this.baseParams.processId.slice(-10);
        let auditParams = {
            operate_person_code: this.baseParams.operatorCode,
            operate_person_name: this.baseParams.operatorName,
            tran_serial_no: serialno, //交易流水号
            visit_no: this.registerNo, //门诊挂号号
            medical_dept_code: "1200", //科室编码
            medical_dept_name: "口腔科", //科室名称
            visit_type: "2", //就诊类型（2门诊）
            medicine_type: "101", //医疗类别 101普通
            card_no: this.patient.aac999, //个人电脑编号
            pc_no: this.patient.aac999, //个人电脑编号
            patient_name: this.patient.aac003, //姓名
            sex: this.patient.aac004, //性别
            age: this.patient.bae093, //年龄
            birth_date: this.patient.aac006, //出生日期
            insurance_type: "1", //险种类型,暂时使用老医保接口数据
            doctor_advice_no: serialno, //处方流水号
            doctor_code: this.doctor.channelObjectId, //医师编号
            doctor_name: this.doctor.channelObjectName, //医师姓名
            diagnoses: [],
            advice_details: []
        };
        for(let i = 1; i <= this.selectedDiagnoses.length; i++) {
            let diagnoseId = this.selectedDiagnoses[i-1];
            let diagnoseItem = this.diagnoses.find(function(o){
                return o.channelObjectId == diagnoseId;
            });
            auditParams.diagnoses.push({
                diagnose_no: i + '', //诊断序号
                diagnose_code: diagnoseId, //诊断代码
                diagnose_desc: diagnoseItem ? diagnoseItem.channelObjectName : '' //诊断描述
            });
        }
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    let advice = {
                        project_code: item.chargeItem.channelData.id, //项目编码
                        hospital_code: item.chargeItem.channelData.innerObjectId, //院内项目编码
                        project_name: item.chargeItem.channelData.name, //项目名称
                        standard_code: item.chargeItem.channelData.drugStandardCode, //本位码
                        is_out_recip: "0", //外配处方标志（0：非外配处方；1：外配处方）
                        recipe_no: serialno, //处方号
                        price: item.chargeItem.price, //单价
                        medical_number: item.amount, //数量
                        dose_unit: item.chargeItem.channelData.unit, //单位
                        amount: item.total //金额
                    };

                    if (item.chargeItem.channelData.chargeItemType == '1' && item.chargeItem.advice) {
                        Object.assign(advice, item.chargeItem.advice);
                    }
                    auditParams.advice_details.push(advice);
                }
            });
        });

        return this.wisdomservice.audit(auditParams).toPromise();
    }

    async queryUpload(): Promise<any> {
        let queryParams = _.extend(
            {
                akc190: this.registerNo, //门诊流水号
                aaz500: this.patient.medicareNo //社保卡号
            },
            this.baseParams
        );

        return this.yibaoservice.fy003(queryParams).toPromise();
    }

    async cancelUpload(): Promise<any> {
        var cancelParams = _.extend(
            {
                akc190: this.registerNo, //就诊流水号
                bke384: this.getJsxlh(2), //医药机构结算业务序列号
                listsize: 0, //发送记录数
                inputlist: [] //发送的数据集消息
            },
            this.baseParams
        );
        return this.yibaoservice.fy002(cancelParams).toPromise();
    }

    async upload(): Promise<any> {
        let chargeItems = [];
        let nowstr = this.datePipe.transform(new Date(), "yyyyMMdd");
        let no = 0;
        let sum = 0;
        let doctorid = this.doctor.channelObjectId;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    no++;
                    sum += item.total;
                    chargeItems.push({
                        aae072: no, //费用单据号
                        bkc369: "1", //单据类型:普通单据
                        bkf500: no, //费用序列号
                        ake001: item.chargeItem.channelData.id, //社保目录编码
                        ake002: item.chargeItem.channelData.name, //社保目录名称
                        bkm017: item.chargeItem.channelData.drugStandardCode, //药品本位码
                        ake005: item.chargeItem.channelData.innerObjectId, //协议机构内部目录编码
                        ake006: item.chargeItem.name, //协议机构内部目录名称
                        aka070: item.chargeItem.channelData.drugType, //剂型
                        aka074: item.chargeItem.channelData.drugSpec, //规格
                        akc225: item.chargeItem.price, //单价
                        akc226: item.amount, //数量
                        akc264: item.total, //医疗费总额
                        aka067: item.chargeItem.channelData.unit, //计价单位
                        akc271: nowstr, //费用单据日期
                        bkc320: doctorid //开具费用医药师编码
                    });
                }
            });
        });
        this.totalAmount = Number(sum.toFixed(4));
            
        let uploadParams = _.extend(
            {
                akc190: this.registerNo, //门诊流水号
                bke384: this.getJsxlh(2), //医药机构结算业务序列号
                listsize: chargeItems.length, //发送记录数
                inputlist: chargeItems //发送的数据集消息
            },
            this.baseParams
        );

        return this.yibaoservice.fy001(uploadParams).mergeMap(res => {
            this.jiesuanNo = uploadParams.bke384;
            return Observable.of(null);
        }).toPromise();
    }

    async preSettleAction(): Promise<any> {
        let settlementParams = _.extend(
            {
                akc190: this.registerNo, //门诊流水号
                aka130: "11", //医疗类别:普通门诊
                bkc320: this.doctor.channelObjectId, //诊断医生编码
                ckc350: this.doctor.channelObjectName, //诊断医生姓名
                ckc351: this.selectedDiagnoses.length > 0 ? this.selectedDiagnoses[0] : "", //主疾病编码
                ckc352: this.selectedDiagnoses.length > 1 ? this.selectedDiagnoses[1] : "", //次要疾病编码1
                ckc353: this.selectedDiagnoses.length > 2 ? this.selectedDiagnoses[2] : "", //次要疾病编码2
                aka030: "12", //结算类别:个人医疗费本地联网结算
                akc264: this.totalAmount, //医疗费总额
                ckc601: "0", //医保费用先行支付记账标志
                bke384: this.jiesuanNo //医药机构结算业务序列号
            },
            this.baseParams
        );

        return this.yibaoservice.fy004(settlementParams)
        .mergeMap(res => {
            this.settleResult = res;
            let request = {
                actionName: "PreSettleAction",
                hisData: this.hisData,
                settleResult: this.settleResult,
                jiesuanNo: this.jiesuanNo
            };
            return this.processService.action(this.processid, request);
        })
        .mergeMap(res => {
            return this.doAction(res);
        }).toPromise();
    }

    public settle(): any {
        abp.ui.setBusy();

        let settlementParams = _.extend(
            {
                bzz269: this.password, //密码
                akc190: this.registerNo, //门诊流水号
                aka130: "11", //医疗类别:普通门诊
                bkc320: this.doctor.channelObjectId, //诊断医生编码
                ckc350: this.doctor.channelObjectName, //诊断医生姓名
                ckc351: this.selectedDiagnoses.length > 0 ? this.selectedDiagnoses[0] : "", //主疾病编码
                ckc352: this.selectedDiagnoses.length > 1 ? this.selectedDiagnoses[1] : "", //次要疾病编码1
                ckc353: this.selectedDiagnoses.length > 2 ? this.selectedDiagnoses[2] : "", //次要疾病编码2
                aka030: "12", //结算类别:个人医疗费本地联网结算
                akc264: this.totalAmount, //医疗费总额
                ckc601: "0", //医保费用先行支付记账标志
                bke384: this.jiesuanNo //医药机构结算业务序列号
            },
            this.baseParams
        );

        this.yibaoservice
            .fy005(settlementParams)
            .mergeMap(res => {
                this.settleResult = res;

                let actiondata = {
                    actionName: "SettleAction",
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, actiondata);
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

    openWisdomWin(option): void {
        //是否弹窗  0 不弹窗  1 弹窗 默认O
        if (!option.is_open_window || option.is_open_window == "0") return;
        if (!option.window_url) return;

        var sizearr = option.window_size.split(",");
        var width = parseInt(sizearr[0]);
        var height = parseInt(sizearr[1]);
        var top = Math.round((window.screen.availHeight - height) / 2);
        var left = Math.round((window.screen.availWidth - width) / 2);
        let wisdomWin = window.open(
            option.window_url,
            "_blank",
            "height=" +
                height +
                ", width=" +
                width +
                ", top=" +
                top +
                ", left= " +
                left +
                ", toolbar=no, menubar=no, scrollbars=auto, resizable=no, location=yes, status=no"
        );

        //1 置顶 2 常规（常规(5秒消失)） 默认 2常规
        if (option.window_open_way == "2") {
            setTimeout(function(win) {
                if (win) {
                    win.close();
                }
            }, 5000, wisdomWin);
        }
    }
}
