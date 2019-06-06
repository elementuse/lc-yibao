import { NgModule } from '@angular/core';
import { ChargeItemShenzhenService } from 'process/shenzhen/chargeItem-shenzhen.service';
import { ChargeItemServiceFactory } from './chargeItem.factory';
import { ChargeItemXinzhouService } from 'process/xinzhou/chargeItem-xinzhou.service';
import { ChargeItemChangxingService } from 'process/changxing/chargeItem-changxing.service';
import { ClientXinzhouProxy } from 'process/xinzhou/client-xinzhou.proxy';
import { ClientFujianfuzhouProxy } from 'process/fujianfuzhou/client-fujianfuzhou.proxy';
import { ClientLongyanProxy } from 'process/longyan/client-longyan.proxy';
import { ClientHangzhouProxy } from 'process/hangzhou/client-hangzhou.proxy';
import { ClientChangxingProxy } from 'process/changxing/client-changxing.proxy';
import { ClientTaizhouProxy } from 'process/taizhou/client-taizhou.proxy';
import { ChargeItemTaizhouService } from 'process/taizhou/chargeItem-taizhou.service';

@NgModule({
    providers: [
        ChargeItemServiceFactory,
        ChargeItemShenzhenService,
        ChargeItemXinzhouService,
        ChargeItemChangxingService,
        ClientXinzhouProxy,
        ClientFujianfuzhouProxy,
        ClientLongyanProxy,
        ClientHangzhouProxy,
        ClientChangxingProxy,
        ClientTaizhouProxy,
        ChargeItemTaizhouService
    ]
})
export class ChargeItemServiceModule { 
}
