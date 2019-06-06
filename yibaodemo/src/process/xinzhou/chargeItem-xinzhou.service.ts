import { IChargeItemService } from "@shared/IchargeItem.service";
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";
import { ClientXinzhouProxy } from "./client-xinzhou.proxy";
import { Injectable } from "@angular/core";

@Injectable()
export class ChargeItemXinzhouService implements IChargeItemService {
    constructor(
        private yibaoservice: ClientXinzhouProxy
    ) {}
    
    RegisterToYibao(item: IChannelObjectDto): Promise<void> {
        let yyxm = {
            yyxmbm: item.hisObjectId,
            yyxmmc: item.channelObjectName,
            ypbz: item.fields["mllb"] == '001' ? "1" : "0",
            mllb: item.fields["mllb"],
            mzjsxmbh: item.fields["jsxm"],
            zyjsxmbh: item.fields["jsxm"]
        };

        return this.yibaoservice.addyyxm(yyxm).toPromise();
    }
    
    UpdateToYibao(item: IChannelObjectDto): Promise<void> {
        return this.RegisterToYibao(item);
    }

    UnRegisterToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }

    ApproveToYibao(item: IChannelObjectDto): Promise<boolean> {
        return Promise.resolve(true);
    }

}