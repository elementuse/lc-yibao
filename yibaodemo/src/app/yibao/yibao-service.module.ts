import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as YibaoService from '@app/yibao/yibao.service'

@NgModule({
    declarations: [],
    imports: [ CommonModule ],
    exports: [],
    providers: [
        YibaoService.HeilongjiangYibaoService,
        YibaoService.JingdezhenYibaoService,
        YibaoService.ShenzhenYibaoService,
        YibaoService.LongyanYibaoService,
        //YibaoService.FujianfuzhouYibaoService,
    ],
})
export class YibaoServiceModule {

}
