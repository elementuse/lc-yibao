import { Component, OnInit, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy } from "@shared/service-proxies/service-proxies";
import { Client<%= classify(name) %>Proxy } from "./client-<%= dasherize(name) %>.proxy";
import { Consts<%= classify(name) %> } from "./consts-<%= dasherize(name) %>";
import { Observable } from "rxjs";

@Component({
    templateUrl: "./refund-<%= dasherize(name) %>.component.html"
})
export class Refund<%= classify(name) %>Component extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};

    public channel: string = "<%= classify(name) %>";
    public patient: any;
    public hisData: hisDataModel;
    public settleResult: any;
    public state: string;
    public failedMessage: string;

    public processid: string = "";
    public userid: string = "0000";

    public subject = new BehaviorSubject("");
    public config: any = Consts<%= classify(name) %>.yibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: Client<%= classify(name) %>Proxy,
        protected activatedRoute: ActivatedRoute
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
            //TODO:退费参数
            }, this.baseParams);
        this.yibaoservice
            .refund(refundParams)
            .mergeMap(res => {
                abp.message.success("退费完成");
                let request = {
                    actionName: "RefundAction",
                    refundResult: res
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
