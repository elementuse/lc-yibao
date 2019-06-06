import { IChargeItemService } from "@shared/IchargeItem.service";
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";
import { Injectable } from "@angular/core";

@Injectable()
export class ChargeItemShenzhenService implements IChargeItemService {
    constructor(
    ) {}
    
    RegisterToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }
    
    UpdateToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
        // Observable.throwError('error').toPromise();
    }

    UnRegisterToYibao(item: IChannelObjectDto): Promise<void> {
        return Promise.resolve();
    }

    ApproveToYibao(item: IChannelObjectDto): Promise<boolean> {
        return Promise.resolve(true);
    }

}