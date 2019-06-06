import { IChargeItemService } from "@shared/IchargeItem.service";
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";
import { ClientTaizhouProxy } from "./client-taizhou.proxy";
import { Injectable } from "@angular/core";
import * as moment from "moment";

@Injectable()
export class ChargeItemTaizhouService implements IChargeItemService {
    constructor(
        private yibaoservice: ClientTaizhouProxy
    ) {}
    
    async RegisterToYibao(item: IChannelObjectDto): Promise<void> {
        let approved = await this.ApproveToYibao(item);
        if (approved) {
            await this.UnRegisterToYibao(item);
        }

        let params = {
            p1: "0",
            p2: "",
            p3: "1",
            p4: "",
            p5: "1",
            p6: [
                {
                    p1: item.fields["chargeItemType"],
                    p2: item.fields["projectNo"],
                    p3: item.hisObjectId,
                    p4: item.channelObjectName,
                    p11: "1",
                    p12: moment().format("YYYYMMDD")
                }
            ]
        };

        return this.yibaoservice.catalogupload(params).toPromise();
    }
    
    UpdateToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }

    UnRegisterToYibao(item: IChannelObjectDto): Promise<void> {
        let params = {
            p1: "0",
            p2: "",
            p3: "1",
            p4: "",
            p5: "1",
            p6: [
                {
                    p1: item.fields["chargeItemType"],
                    p2: item.fields["projectNo"],
                    p3: item.hisObjectId,
                    p4: item.channelObjectName,
                    p11: "9",
                    p12: moment().format("YYYYMMDD")
                }
            ]
        };

        return this.yibaoservice.catalogupload(params).toPromise();
    }

    async ApproveToYibao(item: IChannelObjectDto): Promise<boolean> {
        let params = {
            p1: "0",
            p2: "",
            p3: "1",
            p4: "",
            p5: [
                {
                    p1: item.fields["chargeItemType"],
                    p2: item.hisObjectId
                }
            ]
        };

        let res = await this.yibaoservice.catalogquery(params).toPromise();
        
        let approved = res.p6[0].p3 == "1" ? true : false;
        return Promise.resolve(approved);
    }

}