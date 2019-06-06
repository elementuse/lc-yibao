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
import { ClientXinzhouProxy } from "./client-xinzhou.proxy";
import { ConstsXinzhou } from "./consts-xinzhou";
import { Observable } from "rxjs";

@Component({
    templateUrl: "./refund-xinzhou.component.html"
})
export class RefundXinzhouComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "Xinzhou";
    public patient: any;
    public hisData: hisDataModel;
    public initResult: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;

    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = ConstsXinzhou.yibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ClientXinzhouProxy,
        private hisservice: HisServiceProxy,
        protected activatedRoute: ActivatedRoute,
        private datePipe: DatePipe
    ) {
        super(injector);
        this.activatedRoute.queryParams.subscribe((queryParams: any) => {
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
        this.getInternalStateWithData();
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
                this.initResult = res.dataStore.initResult;
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

    public refund(): any {
        abp.ui.setBusy();

        let refundParams = _.extend({
                jshid: this.initResult.jshid
            }, this.baseParams);
        this.yibaoservice
            .destroy(refundParams)
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
