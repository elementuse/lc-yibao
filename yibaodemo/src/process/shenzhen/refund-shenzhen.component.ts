import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { processConsts } from "../shared/processConsts";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { ShenzhenYibaoService } from "../process.service";
import {
    ProcessServiceProxy,
    QueryRegisteredItemInput,
    HisServiceProxy,
    ProcessInternalStateDataOutput
} from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./refund-shenzhen.component.html"
})
export class RefundShenzhenComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "ShenzhenYibao";
    public patient: any;
    public hisData: hisDataModel;
    public registerNo: any;
    public jiesuanNo: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;

    public providers: any;
    public userid: string = "0000";
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = processConsts.shenzhenYibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private yibaoservice: ShenzhenYibaoService,
        private hisservice: HisServiceProxy,
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
    }

    public getInternalStateWithData() {
        let request = {
            processId: this.processid
        };
        this.processService
            .getInternalStateWithData(this.processid)
            .subscribe(res => {
                this.processService
                    .getInternalStateWithData(this.processid)
                    .subscribe((res: ProcessInternalStateDataOutput) => {
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
                        this.jiesuanNo = res.dataStore.jiesuanNo;
                        this.settleResult = res.dataStore.settleResult;
                        this.failedMessage = res.dataStore.error;
                    });
            });
    }

    public doAction(result: any) {
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
    }

    public refund(): any {
        abp.ui.setBusy();

        let refundParams = _.extend(
            {
                akc190: this.registerNo, //门诊流水号
                bke384: this.jiesuanNo //医药机构结算业务序列号
            },
            this.baseParams
        );
        this.yibaoservice
            .jy002(refundParams)
            .mergeMap(res => {
                if (res.baz700 == "1") {
                    abp.message.success("退费完成");
                    let request = {
                        actionName: "RefundAction",
                        result: res
                    };
                    return this.processService.action(this.processid, request);
                } else if (res.baz700 == "2") {
                    abp.message.info("医保中心不存在结算数据，无需退费");
                    return <Observable<void>>(
                        (<any>(
                            Observable.throw("医保中心不存在结算数据，无需退费")
                        ))
                    );
                } else {
                    abp.message.error("退费失败");
                    return <Observable<void>>(
                        (<any>Observable.throw("退费失败"))
                    );
                }
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe((res:any) => {
                this.doAction(res);
            });
    }
}
