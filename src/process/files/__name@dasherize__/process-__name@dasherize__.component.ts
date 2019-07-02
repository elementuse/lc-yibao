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
import { Client<%= classify(name) %>Proxy } from "./client-<%= dasherize(name) %>.proxy";
import { Consts<%= classify(name) %> } from "./consts-<%= dasherize(name) %>";
import * as moment from "moment";<% if(advice) { %>
import { Advice<%= classify(name) %>Component } from "./advice-<%= dasherize(name) %>.component";<% } %>

@Component({
    templateUrl: "./process-<%= dasherize(name) %>.component.html",
    styleUrls: ['./process-<%= dasherize(name) %>.component.css']
})
export class Process<%= classify(name) %>Component extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};
    
    public channel: string = "<%= classify(name) %>";
    public patient: any;
    public hisData: hisDataModel;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    <% if(department) { %>public departments: any;<% } %>
    <% if(doctor) { %>public providers: any;<% } %>
    <% if(diagnose) { %>public diagnoses: any;
    public selectedDiagnoses: any[];<% } %>
    
    public processid: string = "";
    public userid: string = "0000";

    public subject = new BehaviorSubject("");
    public config: any = Consts<%= classify(name) %>.yibaoConfig;
    <% if(advice) { %>
    @ViewChild("advice<%= classify(name) %>Modal") advice<%= classify(name) %>Modal: Advice<%= classify(name) %>Component;<% } %>

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: Client<%= classify(name) %>Proxy,
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
            hospitalCode: abp.setting.get("<%= classify(name) %>.HospitalCode.Tenant")
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
        this.getInternalStateWithData();
    }
    
    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryRegisteredItemInput = new QueryRegisteredItemInput();
        queryRegisteredItemInput.channel = this.channel;
        <% if(department) { %>
        queryRegisteredItemInput.objectType = "Department";
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.providers = res.items;
            });<% } %>
        <% if(doctor) { %>
        queryRegisteredItemInput.objectType = "Provider";
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.providers = res.items;
            });<% } %>
        <% if(diagnose) { %>
        queryRegisteredItemInput.objectType = "Diagnose";
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.diagnoses = res.items;
            });<% } %>
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
                <% if(diagnose) { %>
                let selectedIds = [];
                res.orderData.diagnoses.forEach(item => {
                    selectedIds.push(item.id);
                });
                this.selectedDiagnoses = selectedIds;<% } %>

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

    // 读卡
    public readcard(): any {
        abp.ui.setBusy();

        let readcardParams = _.extend({
            //TODO:读卡参数
        }, this.baseParams);
        this.yibaoservice
            .readcard(readcardParams)
            .finally(() => {
                abp.ui.clearBusy();
            })
            <% if(wisdom) { %>.mergeMap(res => {
                this.patient = res;
                if (!this.patient) return;

                let remindParams = {
                    //TODO:提醒参数
                };
                return this.yibaoservice.remind(remindParams);
            })
            .subscribe();<% } else { %>
            .subscribe(res => {
                this.patient = res;
            });<% } %>
    }

    //预结算
    public preSettle(): any {<% if(department) { %>
        let dept = this.departments.find(o => {
            return o.hisObjectId == this.hisData.department.id
        });
        if (dept == null) {
            abp.notify.error('请选择科室');
            return;
        }
        <% } 
        if(doctor) { %>
        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        if (doctor == null) {
            abp.notify.error('请选择医生');
            return;
        }
        <% } 
        if(diagnose) { %>
        if (this.selectedDiagnoses.length == 0) {
            this.notify.warn('请选择诊断！');
            return;
        }
        
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
        }<% } %>

        <% if(advice) { %>let advicecheck = true;
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
        if (!advicecheck) return;<% } %>

        abp.ui.setBusy();

        let preSettleParams = _.extend({
            //TODO:预结算参数
        }, this.baseParams);

        //收费项目列表
        let chargeItems = [];
        let thisref = this;
        let nowstr = moment().format("YYYY-MM-DD");
        let no = 0;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    no++;
                    let citem: any = {
                        //TODO:预结算参数
                    };

                    <% if(advice) { %>if (item.chargeItem.channelData.chargeItemType == '1' && item.chargeItem.advice) {
                        //TODO:药品医嘱参数
                    }<% } %>
                    chargeItems.push(citem);
                }
            });
        });

        return this.yibaoservice
            .presettle(preSettleParams)
            .finally(() => {
                abp.ui.clearBusy();
            })
            <% if(wisdom) { %>.mergeMap(res => {
                this.settleResult = res;

                let auditParams = {
                    //TODO:审核参数
                };
                return this.yibaoservice.audit(auditParams);
            })<% } %>
            .mergeMap(res => {<% if(!wisdom) { %>
                this.settleResult = res;<% } %>
                let request = {
                    actionName: "PreSettleAction",
                    patient: this.patient,
                    hisData: this.hisData,
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, request);
            })
            .subscribe(res => {
                this.doAction(res);
            });
    }

    public settle(): any {<% if(department) { %>
        let dept = this.departments.find(o => {
            return o.hisObjectId == this.hisData.department.id
        });
        <% }  if(doctor) { %>
        let doctor = this.providers.find(o => {
            return o.hisObjectId == this.hisData.doctor.id
        });
        <% }  if(diagnose) { %>
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
        }<% } %>

        abp.ui.setBusy();

        let settleParams = _.extend({
            //TODO:结算参数
        }, this.baseParams);

        //收费项目列表
        let chargeItems = [];
        let thisref = this;
        let nowstr = moment().format("YYYY-MM-DD");
        let no = 0;
        this.hisData.chargeItemForms.forEach(function(form) {
            form.chargeItems.forEach(function(item) {
                if (item.insurance) {
                    no++;
                    let citem: any = {
                        //TODO:结算参数
                    };

                    <% if(advice) { %>if (item.chargeItem.channelData.chargeItemType == '1' && item.chargeItem.advice) {
                        //TODO:药品医嘱参数
                    }<% } %>
                    chargeItems.push(citem);
                }
            });
        });

        return this.yibaoservice
            .settle(settleParams)
            .mergeMap(res => {
                this.settleResult = res;
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
