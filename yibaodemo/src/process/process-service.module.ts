import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import *  as ProcessService from './process.service';
import { AbpHttpInterceptor } from 'abp-ng2-module/dist/src/abpHttpInterceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
    declarations: [],
    imports: [ CommonModule ],
    exports: [],
    providers: [
        ProcessService.CommonProcessService,
        ProcessService.HeilongjiangProcessService,
        ProcessService.JingdezhenProcessService,
        ProcessService.ShenzhenYibaoService,
        ProcessService.ShenzhenWisdomService,
        ProcessService.QingdaoProcessService,
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true }
    ],
})
export class ProcessServiceModule {}
