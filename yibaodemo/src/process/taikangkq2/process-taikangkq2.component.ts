import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy, HisServiceProxy, TaikangKq2ServiceProxy, InsuranceResponse, Insurance_Data_PolicyInfo, PreSettleRequestItems, InsuranceRequest, InsuranceDetailRequest, PreSettleRequest, PreSettleResult, SettleRequest, SettleRequestItems, UploadInsuranceFileRequest } from "@shared/service-proxies/service-proxies";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { AppConsts } from "@shared/AppConsts";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AbpSessionService } from 'abp-ng2-module/dist/src/session/abp-session.service';
import { query } from "@angular/core/src/render3/query";

@Component({
    templateUrl: './process-taikangkq2.component.html',
    animations: [appModuleAnimation()]
})
export class ProcessTaikangKq2Component extends AppComponentBase
    implements OnInit {
    public channel: string = 'TaikangKq2';
    public userid: string = '0000';
    public processid: string = '';
    public subject = new BehaviorSubject('');
    public hisData: hisDataModel;
    public state: string;
    public failedMessage: string;
    public patient: {
        idType: string,
        idCard: string,
        pName: string,
        partnerId: string
    }={
        idType:'身份证',
        idCard:null,
        pName:null,
        partnerId:null
    };
    public baseParams: any = {};
    public insuranceData: InsuranceResponse;
    public preSettleOutput: {
        receipt: any,
        preSettleReponse: any
    };
    public settleResult: any;
    public hospitalCode: string;
    public payList: any = [];
    public currentPolicyNo: string = '';
    public showInsuranceList: boolean = false;
    public showPreSettleList: boolean = false;
    public infos: Array<any> = [];

    public uploadUrl: string;
    public uploadedFiles: any[] = [];
    public receiptNo: string = '';

    display: boolean = false;

    public tempPolicyInfo: Insurance_Data_PolicyInfo;

    constructor(
        public injector: Injector,
        private commonService: CommonProcessService,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private taikangKq2ServiceProxy: TaikangKq2ServiceProxy,
        protected activatedRoute: ActivatedRoute
    ) {
        super(injector);
        this.uploadUrl = AppConsts.remoteServiceBaseUrl + '/Upload/UploadFiles';
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
                            this.failedMessage = result.data;
                        });
                }
            }
        });
    }

    ngOnInit(): void {
        this.getInternalStateWithData();
    }

    public getInternalStateWithData() {
        let request = {
            processId: this.processid
        };

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
                });
            });

            let hospitalCodeKey = `TaikangKq2.HospitalCode.Tenant`;
            this.hospitalCode = abp.setting.get(hospitalCodeKey);
            if (this.hospitalCode == null || this.hospitalCode.trim() == "") {
                abp.message.error('泰康齿科合作编码不能为空');
                return Observable.throwError('泰康齿科合作编码不能为空');
            }

            this.hisData = tempdata;

            this.state = res.state;
            this.baseParams.sequenceNumber = res.sequenceNumber;
            this.failedMessage = res.dataStore.error;
            this.currentPolicyNo = res.dataStore.currenPolicyNo;
            if (res.dataStore.patient) {
                this.patient = res.dataStore.patient;
            } else {
                this.patient = {
                    pName: res.hisData.patient.name,
                    idCard: res.hisData.patient.identityNumber,
                    idType: '身份证',
                    partnerId: null
                };
            }
            this.preSettleOutput = {
                preSettleReponse: res.dataStore.preSettleData ? res.dataStore.preSettleData : null,
                receipt: res.dataStore.preReceiptData ? res.dataStore.preReceiptData : null
            };
            this.settleResult = res.dataStore.settleResult ? res.dataStore.settleResult : this.settleResult;

            //计算项目保单列表
            this.calculusChargeItems();
        })
    }

    public async queryInsurance(): Promise<any> {
        try {
            abp.ui.setBusy();
            let queryParams: InsuranceRequest;
            queryParams = new InsuranceRequest()
            queryParams.idCard = this.patient.idCard;
            queryParams.idType = this.patient.idType;
            queryParams.name = this.patient.pName;
            queryParams.partnerId = this.hospitalCode;

            var res = await this.taikangKq2ServiceProxy.getInsuranceList(this.processid, queryParams).toPromise();
            this.insuranceData = res;
            this.showInsuranceList = true;
            window.scrollTo(0, document.body.scrollHeight);
        }
        catch (e) {
            abp.notify.error('获取保险列表失败');
        }
        finally {
            abp.ui.clearBusy();
        }
    }

    public async queryInsuranceDetail(policyInfos: Insurance_Data_PolicyInfo): Promise<any> {
        try {
            abp.ui.setBusy();
            this.tempPolicyInfo = policyInfos;

            let queryParams: InsuranceDetailRequest;
            queryParams = new InsuranceDetailRequest()
            queryParams.idCard = this.patient.idCard;
            queryParams.idType = this.patient.idType;
            queryParams.name = this.patient.pName;
            queryParams.partnerId = this.hospitalCode;
            queryParams.policyNo = policyInfos.policyNo;

            var res = await this.taikangKq2ServiceProxy.getInsuranceDetailList(this.processid, queryParams).toPromise();
            this.infos = res.data.insuranceInfos;
            setTimeout(() => {
                this.display = true;
            }, 1000);
        }
        catch (e) {
            abp.notify.error('获取保险详情失败');
        } finally {
            abp.ui.clearBusy();
        }
    }

    public async preSettle(policyInfos: Insurance_Data_PolicyInfo): Promise<any> {
        try {
            abp.ui.setBusy();
            let preSettlementParams: PreSettleRequest;
            preSettlementParams = new PreSettleRequest();
            preSettlementParams.partnerId = this.hospitalCode;
            preSettlementParams.idType = this.patient.idType;
            preSettlementParams.idCard = this.patient.idCard;
            preSettlementParams.name = this.patient.pName;
            preSettlementParams.policyNo = policyInfos.policyNo;
            preSettlementParams.items = [];

            this.hisData.chargeItemForms.forEach(form => {
                form.chargeItems.forEach(item => {

                    let it: PreSettleRequestItems;

                    it = new PreSettleRequestItems()
                    it.itemNo= item.chargeItem.channelData.id ? item.chargeItem.channelData.id : -1; //编号
                    it.itemName= item.chargeItem.name;         //名称
                    it.price= item.chargeItem.price;           //单价
                    it.num= item.amount;                        //数量

                    preSettlementParams.items.push(it);
                });
            });

            var res = await this.taikangKq2ServiceProxy.preSettle(this.processid, preSettlementParams).toPromise();
            this.preSettleOutput = res;
            this.currentPolicyNo = policyInfos.policyNo;
            this.calculusChargeItems();
            this.showPreSettleList = true;
            window.scrollTo(0, document.body.scrollHeight);
        } catch (e) {
            abp.notify.error('保险试算出错');
        } finally {
            abp.ui.clearBusy();
        }
    }

    async settle(): Promise<any> {
        try {
            abp.ui.setBusy();
            let settlementParams: SettleRequest;
            settlementParams = new SettleRequest()
            settlementParams.partnerId = this.hospitalCode;
            settlementParams.transId = this.processid;
            settlementParams.idType = this.patient.idType;
            settlementParams.idCard = this.patient.idCard;
            settlementParams.name = this.patient.pName;
            settlementParams.totalPrice = this.hisData.total;
            settlementParams.payInsurance = this.preSettleOutput.receipt.reimbursement;
            settlementParams.selfInsurance = this.preSettleOutput.preSettleReponse.data.selfPrice;
            settlementParams.selfPrice = this.preSettleOutput.preSettleReponse.data.selfPrice;
            settlementParams.discountSelfPrice = this.preSettleOutput.preSettleReponse.data.discountSelfPrice;
            settlementParams.outSelfPrice = this.preSettleOutput.preSettleReponse.data.outSelfPrice;
            settlementParams.actualPayPrice = this.hisData.total;
            settlementParams.policyNo = this.currentPolicyNo;
            settlementParams.items = [];//{ itemNo: "", itemName: "", price: "", num: "" }

            this.hisData.chargeItemForms.forEach(form => {
                form.chargeItems.forEach(item => {

                    let it: SettleRequestItems;
                    it = new SettleRequestItems()
                    it.itemNo = item.chargeItem.channelData.id ? item.chargeItem.channelData.id : -1; //编号
                    it.itemName = item.chargeItem.name;         //名称
                    it.price = item.chargeItem.price;           //单价
                    it.num = item.amount;                        //数量

                    settlementParams.items.push(it);
                });
            });

            var res = await this.taikangKq2ServiceProxy.settle(this.processid, settlementParams).toPromise();
            this.settleResult = res;
            var actiondata = {
                actionName: 'CommitAction',
                currenPolicyNo: this.currentPolicyNo,
                patient: this.patient,
                hisData: this.hisData,
                preReceiptData: this.preSettleOutput.receipt,
                preSettleData: this.preSettleOutput.preSettleReponse,
                settleResult: this.settleResult
            };
            var actionRes = await this.processService.action(this.processid, actiondata).toPromise();
            await this.doAction(actionRes).toPromise();
        } catch (e) {
            abp.notify.error("泰康齿科保险出单错误,请重试");
        } finally {
            abp.ui.clearBusy();
        }
    }

    public calculusChargeItems(): any {
        if (this.preSettleOutput.receipt == null) return;

        var list = [];
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                var receiptItem = this.preSettleOutput.receipt.receiptItems.find(o => o.chargeItem.id == item.chargeItem.id);
                list.push(
                    {
                        itemNo: item.chargeItem.channelData.id,
                        itemName: item.chargeItem.name,
                        unit: item.chargeItem.unit,
                        price: item.chargeItem.price,
                        amount: item.amount,
                        total: item.total,
                        payMoney: receiptItem.reimbursement
                    });
            });
        });

        this.payList = list;
    }

    async onUpload(event): Promise<any> {
        try {
            abp.ui.clearBusy();
            for (const file of event.files) {
                this.uploadedFiles.push(file);
            }

            let uploadInsuranceFileParams: UploadInsuranceFileRequest;
            uploadInsuranceFileParams = new UploadInsuranceFileRequest()
            uploadInsuranceFileParams.partnerId = this.hospitalCode;
            uploadInsuranceFileParams.claimNo = this.settleResult.data.claimNo;
            uploadInsuranceFileParams.receiptNo = this.receiptNo;
            uploadInsuranceFileParams.type = 'image';
            uploadInsuranceFileParams.fileInfo = JSON.parse(event.xhr.response).result;

            await this.taikangKq2ServiceProxy.uploadInsuranceFile(this.processid, uploadInsuranceFileParams).toPromise();
            var actionRes = await this.processService.action(this.processid, {
                actionName: 'UploadReceiptAction',
            }).toPromise();
            this.message.success("出单完成");
            await this.doAction(actionRes).toPromise();
        } catch (e) {
            abp.notify.error("提交发票信息失败");
        }
        finally {
            abp.ui.clearBusy();
        }
    }

    onBeforeSend(event): void {
        abp.ui.clearBusy();
        event.xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());
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
