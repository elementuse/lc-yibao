import { IChargeItemService } from "@shared/IchargeItem.service";
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";
import { ClientChangxingProxy } from "./client-changxing.proxy";
import { Injectable } from "@angular/core";

@Injectable()
export class ChargeItemChangxingService implements IChargeItemService {
    constructor(
        private yibaoservice: ClientChangxingProxy
    ) {}
    
    RegisterToYibao(item: IChannelObjectDto): Promise<void> {
        let params = {
            p1: "0",
            p2: "",
            p3: "1",
            p4: "",
            p5: "1",
            p6: [
                {
                    p1: item.channelObjectId,
                    p2: item.hisObjectId,
                    p3: "1",
                    p4: item.channelObjectName,
                    p5: item.fields["chargeItemType"],
                    p6: item.fields["chargeItemCategory"],
                    p7: item.fields["chargeItemLevel"],
                    p11: item.fields["drugUnit"],
                    p13: item.fields["drugType"],
                    p14: item.fields["drugSpec"],
                    p15: "1"
                }
            ]
        };

        return this.yibaoservice.catalogupload(params).toPromise();
    }
    
    UpdateToYibao(item: IChannelObjectDto): Promise<void> {
        let params = {
            p1: "0",
            p2: "",
            p3: "1",
            p4: "",
            p5: "1",
            p6: [
                {
                    p1: item.channelObjectId,
                    p2: item.hisObjectId,
                    p3: "1",
                    p4: item.channelObjectName,
                    p5: item.fields["chargeItemType"],
                    p6: item.fields["chargeItemCategory"],
                    p7: item.fields["chargeItemLevel"],
                    p11: item.fields["drugUnit"],
                    p13: item.fields["drugType"],
                    p14: item.fields["drugSpec"],
                    p15: "2"
                }
            ]
        };

        return this.yibaoservice.catalogupload(params).toPromise();
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
                    p1: item.channelObjectId,
                    p2: item.hisObjectId,
                    p3: "1",
                    p4: item.channelObjectName,
                    p5: item.fields["chargeItemType"],
                    p6: item.fields["chargeItemCategory"],
                    p7: item.fields["chargeItemLevel"],
                    p11: item.fields["drugUnit"],
                    p13: item.fields["drugType"],
                    p14: item.fields["drugSpec"],
                    p15: "9"
                }
            ]
        };

        return this.yibaoservice.catalogupload(params).toPromise();
    }

    ApproveToYibao(item: IChannelObjectDto): Promise<boolean> {
        return Promise.resolve(true);
    }

}