import { IChargeItemService } from "@shared/IchargeItem.service";
import { Injector,Injectable } from "@angular/core";
import { ChargeItemTaizhouService } from "process/taizhou/chargeItem-taizhou.service";

@Injectable()
export class ChargeItemServiceFactory {
    constructor(public injector:Injector){

    }
    public GetService(channel: string): IChargeItemService {
        // TODO: implement
        switch (channel) {

            case 'Taizhou':
                return this.injector.get(ChargeItemTaizhouService);
                
            default:
                break;
            }
        return null;
    }
}