import { Component, OnInit, Injector } from "@angular/core";
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
    templateUrl: "./refund-jingdezhen.component.html"
})
export class RefundJingdezhenComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "Jingdezhen";
    public patient: any;
    public hisData: hisDataModel;
    public registerNo: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;

    public providers: any;
    public userid: string = "0000";
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = processConsts.jingdezhenYibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: JingdezhenProcessService,
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
                this.settleResult = res.dataStore.settleResult;
                this.failedMessage = res.dataStore.error;
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
                p1: this.registerNo, //就诊流水号
                p2: this.settleResult.p42, //单据号
                p3: this.datePipe.transform(new Date(), "yyyyMMddHHmmss"), //结算日期
                p4: this.baseParams.opratorName, //经办人
                p5: "1", //是否保存处方标志，默认是
                p6: "03", //开发商标志,其他
                p7: this.patient.p1, //个人编号
                p8: this.patient.p4, //姓名
                p9: this.patient.p8 //社会保障卡卡号
            },
            this.baseParams
        );
        this.yibaoservice
            .refund(refundParams)
            .mergeMap(res => {
                abp.message.success("退费完成");
                let request = {
                    actionName: "RefundAction",
                    result: res
                };
                return this.processService.action(this.processid, request);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe((res:any) => {
                this.doAction(res);
            });
    }
}
