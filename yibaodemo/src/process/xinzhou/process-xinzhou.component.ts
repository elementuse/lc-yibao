import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { CommonProcessService } from "../process.service";
import { ProcessServiceProxy, QueryRegisteredItemInput, HisServiceProxy } from "@shared/service-proxies/service-proxies";
import { ClientXinzhouProxy } from "./client-xinzhou.proxy";
import { ConstsXinzhou } from "./consts-xinzhou";

@Component({
    templateUrl: "./process-xinzhou.component.html"
})
export class ProcessXinzhouComponent extends AppComponentBase
    implements OnInit {
    public baseParams: any = {};
    
    public channel: string = "Xinzhou";
    public patient: any;
    public hisData: hisDataModel;
    public initResult: any;
    public settleResult: any;
    public state: string;
    public failedMessage: string;
    public printing: boolean = false;

    public departments: any;
    public processid: string = "";

    public subject = new BehaviorSubject("");
    public config: any = ConstsXinzhou.yibaoConfig;

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private commonservice: CommonProcessService,
        private yibaoservice: ClientXinzhouProxy,
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
    }
    
    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryRegisteredItemInput = new QueryRegisteredItemInput();
        queryRegisteredItemInput.objectType = "Department";
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.departments = res.items;

                return this.getInternalStateWithData();
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

    // 读卡
    public readcard(): any {
        abp.ui.setBusy();

        let readcardParams = Object.assign({}, this.baseParams, {
            yltclb: "6"
        });
        this.yibaoservice
            .readcard(readcardParams)
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.patient = res;
            });
    }

    // 上传
    public async upload(): Promise<any> {
        let dept = this.departments.find(o => {
            return o.hisObjectId == this.hisData.department.id
        });

        if (dept == null) {
            this.notify.error('请选择科室');
            return;
        }

        abp.ui.setBusy();

        try {
            this.initResult = await this.initmz();

            let uploadData = [];
            let thisref = this;
            this.hisData.chargeItemForms.forEach(function(form) {
                form.chargeItems.forEach(function(item) {
                    if (item.insurance) {
                        uploadData.push(_.extend({
                            yyxmbm: item.chargeItem.id,
                            yyxmmc: item.chargeItem.name,
                            dj: item.chargeItem.price,
                            sl: item.amount,
                            zje: item.total,
                            fyfssj: thisref.datePipe.transform(new Date(), "yyyy-MM-dd"),
                            zxksbm: dept.channelObjectId,
                            kdksbm: dept.channelObjectId
                        }, thisref.baseParams));
                    }
                });
            });

            await Observable.from(uploadData)
                .concatMap(item => {
                    return this.yibaoservice.fymx(item);
                })
                .toPromise();

            let request = {
                actionName: "UploadAction",
                uploadedData: uploadData,
                patient: this.patient,
                initResult: this.initResult
            };
            return this.processService
                .action(this.processid, request)
                .mergeMap(res => {
                    return this.doAction(res);
                })
                .toPromise();
        } catch (error) {
            console.log(error);
        } finally {
            abp.ui.clearBusy();
        }
    }

    async initmz(): Promise<any> {
        let initParams = _.extend({
            sbjgbh: this.patient.sbjgbh,
            yltclb: "6",
            xzbz: "C",
            grbh: this.patient.grbh,
            xm: this.patient.xm,
            xb: this.patient.xb,
            jbbm: "",
            fyrq: this.datePipe.transform(new Date(), "yyyy-MM-dd"),
            kh: this.patient.kh
        }, this.baseParams);

        return this.yibaoservice.initmz(initParams).toPromise();
    }

    public async preSettle(): Promise<any> {
        abp.ui.setBusy();

        return this.yibaoservice
            .settlepre(this.baseParams)
            .mergeMap(res => {
                this.settleResult = res;
                let request = {
                    actionName: "PreSettleAction",
                    hisData: this.hisData,
                    settleResult: this.settleResult
                };
                return this.processService.action(this.processid, request);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.doAction(res);
            });
    }

    public settle(): any {
        abp.ui.setBusy();

        return this.yibaoservice
            .settlereal(this.baseParams)
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

        let printParams = _.extend({
            jshid: this.initResult.jshid,
            djlx: "FP"
        }, this.baseParams);
        return this.yibaoservice.print(printParams).subscribe(res => {
            this.printing = false;
        });
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
