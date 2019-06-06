import { Component, OnInit, Injector } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { ActivatedRoute } from "@angular/router";
import { AppComponentBase } from "@shared/common/app-component-base";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { hisDataModel } from "../shared/models/hisDataModel";
import { DatePipe } from "@angular/common";
import * as _ from "lodash";
import { 
    CommonProcessService,
    QingdaoProcessService
} from "../process.service";
import {
    ProcessServiceProxy,
    HisServiceProxy,
    QingdaoServiceProxy,
    QueryRegisteredItemInput,
    RegisteredHisItem,
    AuditInput,
    AuditOutput,
    MerItem
} from "@shared/service-proxies/service-proxies";
import { merchantModel } from "@app/yibao/setting/qingdao/merchantModel";

@Component({
    templateUrl: "./process-qingdao.component.html"
})
export class ProcessQingdaoComponent extends AppComponentBase
    implements OnInit {

    public channel: string = "Qingdao";
    public hisData: hisDataModel;
    public auditResult: AuditOutput;
    public state: string;
    public failedMessage: string;

    public operator: RegisteredHisItem;
    public userid: string = "0000";
    public processid: string = "";
    public sequenceNumber: number = 0;

    public subject = new BehaviorSubject("");

    constructor(
        public injector: Injector,
        private processService: ProcessServiceProxy,
        private hisservice: HisServiceProxy,
        private qingdaoService: QingdaoServiceProxy,
        private qingdaoProcessService: QingdaoProcessService,
        private commonservice: CommonProcessService,
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

        //接受者订阅消息
        this.subject.subscribe({
            next: (v) => {
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
        this.getRegisteredItems();
    }

    public getRegisteredItems() {
        let queryRegisteredItemInput: QueryRegisteredItemInput = new QueryRegisteredItemInput();
        queryRegisteredItemInput.objectType = "Provider";
        queryRegisteredItemInput.channel = this.channel;
        this.hisservice
            .getRegisteredItems(queryRegisteredItemInput)
            .subscribe(res => {
                this.operator = res.items.find(e => {
                    return e.hisObjectId == this.userid;
                });
                if (this.operator == null) {
                    this.notify.warn(
                        `找不到当前操作员信息，请在医保平台注册用户${
                            this.userid
                        }`
                    );

                    this.operator = new RegisteredHisItem();
                    this.operator.channelObjectId = "0000";
                    this.operator.channelObjectName = "默认用户";
                }

                return this.getInternalStateWithData();
            });
    }

    public getInternalStateWithData() {
        this.commonservice
            .getInternalStateWithData(this.processid)
            .subscribe(result => {
                let res = result.result;

                this.hisData = res.orderData;
                this.state = res.state;
                this.sequenceNumber = res.sequenceNumber;
                this.failedMessage = res.dataStore.error;

                this.hisData.chargeItemForms.forEach(form => {
                    form.chargeItems.forEach(item => {
                        if (!item.chargeItem.channelData.mer_pack) {
                            item.chargeItem.channelData.mer_pack = item.chargeItem.unit;
                        }
                        item.ratio = ((item.total - item.discount) / item.total * 100).toFixed(2);
                    });
                });
            });
    }

    public doAction(result: any): Observable<any> {
        this.state = result.state;
        this.sequenceNumber = result.sequenceNumber;
        this.subject.next(this.state);
        return Observable.of(null);
    }

    public audit(): any {
        let merchant = merchantModel.fromJSON(abp.setting.get("Qingdao.MerchantInfo"));
        if(!merchant.category || !merchant.name || !merchant.sinid || !merchant.uscc) {
            this.notify.error('商户信息未设置！');
            return;
        }

        let input = new AuditInput();
        input.mct_category = merchant.category;
        input.mct_name = merchant.name;
        input.mct_sub_name = merchant.subname;
        input.mct_oper_id = this.operator.channelObjectId;
        input.mct_uscc = merchant.uscc;
        input.mct_sin_id = merchant.sinid;
        input.merlist = [];
        
        //收费明细
        let typenotset = false;
        this.hisData.chargeItemForms.forEach(form => {
            form.chargeItems.forEach(item => {
                if (!item.chargeItem.channelData.mer_type) {
                    this.notify.error(`${item.chargeItem.name}：未设置所属类型！`);
                    typenotset = true;
                }
                if (!item.chargeItem.channelData.mer_pack) {
                    this.notify.error(`${item.chargeItem.name}：未设置计价单位！`);
                    typenotset = true;
                }

                let meritem = new MerItem();
                meritem.id = item.chargeItem.id;
                meritem.name = item.chargeItem.name;
                meritem.mer_type = item.chargeItem.channelData.mer_type;
                meritem.mer_pack = item.chargeItem.channelData.mer_pack;
                meritem.std_doc_id = item.chargeItem.channelData.std_doc_id;
                meritem.pro_batch_id = item.chargeItem.channelData.pro_batch_id;
                meritem.batch = item.chargeItem.channelData.batch;
                meritem.pro_enterprise = item.chargeItem.channelData.pro_enterprise;
                meritem.gmp_cert_id = item.chargeItem.channelData.gmp_cert_id;
                meritem.mer_specification = item.chargeItem.channelData.mer_specification;
                meritem.mer_name = item.chargeItem.channelData.mer_name;
                meritem.mer_name_short = item.chargeItem.channelData.mer_name_short;
                meritem.comm_name = item.chargeItem.channelData.comm_name;
                meritem.che_name = item.chargeItem.channelData.che_name;
                meritem.mer_biz_code = item.chargeItem.channelData.mer_biz_code;
                meritem.mer_num = item.amount;
                meritem.mer_price = this.parsePrice(item.chargeItem.price * Number(item.ratio) / 100);
                meritem.dis_rate = item.ratio;
                meritem.mer_total = this.parsePrice(item.total);
                meritem.ret_price = this.parsePrice(item.chargeItem.price);
                input.merlist.push(meritem);
            });
        });
        if (typenotset) return;

        //支付信息
        input.payType = "0";
        input.pay_num = "";
        input.amt = this.parsePrice(this.hisData.total);
        input.tra_time = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
        input.remark = "";
        input.memo1 = "";
        input.memo2 = "";
        input.memo3 = "";
        input.memo4 = "";

        abp.ui.setBusy();

        let encryptRequest = {
            processId: this.processid,
            sequenceNumber: this.sequenceNumber,
            input: JSON.stringify(input)
        };
        this.qingdaoProcessService
            .encrypt(encryptRequest)
            .mergeMap(res => {
                input.body = res.output;
                return this.qingdaoService.audit(input);
            })
            .mergeMap(res => {
                this.auditResult = res;
                input.body = '';
                let actiondata = {
                    actionName: "AuditAction",
                    auditData: input,
                    auditResult: this.auditResult,
                    hisData: this.hisData
                };
                return this.processService.action(this.processid, actiondata);
            })
            .finally(() => {
                abp.ui.clearBusy();
            })
            .subscribe(res => {
                this.doAction(res);
            });
    }

    parsePrice(price: number): string {
        return (Array(12).join('0') + price * 100).slice(-12);
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
