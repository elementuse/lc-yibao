import { IChargeItemService } from "@shared/IchargeItem.service";
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";
import { Client<%= classify(name) %>Proxy } from "./client-<%= dasherize(name) %>.proxy";
import { Injectable } from "@angular/core";

@Injectable()
export class ChargeItem<%= classify(name) %>Service implements IChargeItemService {
    constructor(
        private yibaoservice: Client<%= classify(name) %>Proxy
    ) {}
    
    RegisterToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }
    
    UpdateToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }

    UnRegisterToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }

    ApproveToYibao(item: IChannelObjectDto): Promise<boolean> {
        return Promise.resolve(true);
    }
}