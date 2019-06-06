import { Component, OnInit, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { processConsts } from "../shared/processConsts";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import {
    ProcessServiceProxy,
    QueryRegisteredItemInput,
    HisServiceProxy
} from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./refund-taikangkq2.component.html"
})
export class RefundTaikangKq2Component extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "TaikangKq2";
    public patient: any;
    public hisData: hisDataModel;
    public registerData: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;

    public providers: any;
    public userid: string = "0000";
    public processid: string = "";

    public subject = new BehaviorSubject("");

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private commonservice: CommonProcessService,
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
                    //this.notify.warn(
                    //    `找不到当前操作员信息，请在医保平台注册用户${
                    //        this.userid
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
        this.processService
            .getInternalStateWithData(this.processid)
            .subscribe(res => {
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
                this.registerData = res.dataStore.registerData;
                this.settleResult = res.dataStore.settleResult;
                this.failedMessage = res.dataStore.error;
            });
    }

    public doAction(result: any) {
        this.state = result.state;
        this.baseParams.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
    }
}
