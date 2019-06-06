import { Component, OnInit, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    templateUrl: "./refund-qingdao.component.html"
})
export class RefundQingdaoComponent extends AppComponentBase implements OnInit {
    public channel: string = "Qingdao";
    public hisData: hisDataModel;
    public state: string;
    public failedMessage: string;

    public processid: string = "";
    public subject = new BehaviorSubject("");

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private commonservice: CommonProcessService,
        protected activatedRoute: ActivatedRoute
    ) {
        super(injector);
        this.activatedRoute.queryParams.subscribe((queryParams: any) => {
            this.processid = queryParams.processId;
        });

        this.subject.subscribe({
            next: v => {
                if (this.state == "SettleFailed") {
                    this.processService
                        .getDataStoreItem(this.processid, "error")
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

                this.hisData = res.orderData;
                this.state = res.state;
                this.failedMessage = res.dataStore.error;

                this.hisData.chargeItemForms.forEach(form => {
                    form.chargeItems.forEach(item => {
                        item.ratio = ((item.total - item.discount) / item.total * 100).toFixed(2);
                    });
                });
            });
    }

    public doAction(result: any) {
        this.state = result.state;
        this.subject.next(this.state);
    }

    public refund(): any {
        abp.ui.setBusy();

        let request = {
            actionName: "RefundAction"
        };
        this.processService
            .action(this.processid, request)
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe((res: any) => {
                this.doAction(res);
                abp.message.success("退费完成");
            });
    }
}
