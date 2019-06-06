import { Component, OnInit, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy } from "@shared/service-proxies/service-proxies";
import { ClientHangzhouProxy } from "./client-hangzhou.proxy";
import { ConstsHangzhou } from "./consts-hangzhou";
import { Observable } from "rxjs";
import { DatePipe } from "@angular/common";

@Component({
    templateUrl: "./refund-hangzhou.component.html",
    styleUrls: ['./process-hangzhou.component.css']
})
export class RefundHangzhouComponent extends AppComponentBase
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

    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = ConstsHangzhou.yibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
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
                this.registerNo = res.orderData.registerNo;

                this.state = res.state;
                this.baseParams.sequenceNumber = res.sequenceNumber;
                this.patient = res.dataStore.patient;
                this.uploadData = res.dataStore.uploadedData;
                this.uploadResult = res.dataStore.uploadedResult;
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

    public refund(): any {
        abp.ui.setBusy();

        let refundParams = _.extend({
                p1: this.registerNo,
                p2: this.registerNo,
                p3: this.datePipe.transform(new Date(), "yyyyMMddHHmmss")
            }, this.baseParams);
        this.yibaoservice
            .refund(refundParams)
            .mergeMap(res => {
                let queryParams = _.extend({
                    p1: res.hospitalTransactionCode
                }, this.baseParams);
                return this.yibaoservice.querySettlement(queryParams);
            })
            .mergeMap(res => {
                abp.message.success("退费完成");
                this.settleResult = res;
                let request = {
                    actionName: "RefundAction",
                    settleResult: res
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

    public print(): any {
        this.printing = true;
        setTimeout(() => {
            window.print();
            this.printing = false;
        }, 200);
    }
}
