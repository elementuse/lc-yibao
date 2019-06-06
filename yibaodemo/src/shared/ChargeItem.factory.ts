import { IChargeItemService } from "@shared/IchargeItem.service";
import { Injector,Injectable } from "@angular/core";
import { ChargeItemShenzhenService } from "process/shenzhen/chargeItem-shenzhen.service";
import { ChargeItemXinzhouService } from "process/xinzhou/chargeItem-xinzhou.service";
import { ChargeItemChangxingService } from "process/changxing/chargeItem-changxing.service";
import { ChargeItemTaizhouService } from "process/taizhou/chargeItem-taizhou.service";

@Injectable()
export class ChargeItemServiceFactory {
    constructor(public injector:Injector){

    }
    public GetService(channel: string): IChargeItemService {
        // TODO: implement
        switch (channel) {
            case 'ShenzhenYibao':
                return this.injector.get(ChargeItemShenzhenService);   

            case 'Xinzhou':
                return this.injector.get(ChargeItemXinzhouService);

            case 'Changxing':
                return this.injector.get(ChargeItemChangxingService);

            case 'Taizhou':
                return this.injector.get(ChargeItemTaizhouService);
                
            default:
                break;
            }
        return null;
    }
}