import { NgModule } from '@angular/core';
import { ChargeItemServiceFactory } from './chargeItem.factory';
import { ClientTaizhouProxy } from 'process/taizhou/client-taizhou.proxy';
import { ChargeItemTaizhouService } from 'process/taizhou/chargeItem-taizhou.service';

@NgModule({
    providers: [
        ChargeItemServiceFactory,
        ClientTaizhouProxy,
        ChargeItemTaizhouService
    ]
})
export class ChargeItemServiceModule { 
}
