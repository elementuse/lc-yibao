import { Component, OnInit, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, Observable } from "rxjs/Rx";
import { DatePipe } from '@angular/common';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, ProcessServiceProxy, PagedInputDto, StartRefundProcessInput } from '@shared/service-proxies/service-proxies';


@Component({
    templateUrl: './processlist.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class ProcessListComponent extends AppComponentBase implements OnInit {


    loading: boolean = false;
    isHost: boolean = true;
    protected subscription: Subscription;
    channel: string;
    constchannel = yibaoConsts.channel;
    constprocessType = yibaoConsts.processType;
    constprocessState = yibaoConsts.processState;
    tenantid:number;


    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    constructor(
        injector: Injector,
        private processservice: ProcessServiceProxy,
        private _appSessionService: AppSessionService,
        protected router: Router,
        private datepipe: DatePipe) {
        super(injector);
        if (_appSessionService.tenant) {
            this.tenantid = _appSessionService.tenant.id;
        }
    }

    ngOnInit() {
        //this.getList();
    }

    getList(event?: LazyLoadEvent): void {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);

            return;
        }

        let queryChannelObjectInput :PagedInputDto = new PagedInputDto();
        queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event),
        queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event)

        this.processservice.getAll(queryChannelObjectInput).subscribe(result => {
            console.log(result);
            this.primengTableHelper.totalRecordsCount = result.totalCount;
            this.primengTableHelper.records = result.items;
            this.primengTableHelper.hideLoadingIndicator();
        });

    }

    startRefund(record): void {
        let request:StartRefundProcessInput = new StartRefundProcessInput();
        request.chargeProcessId = record.id,
        request.hisOrderId = 'pt-' + new Date().getTime() + '-' + record.id
        this.processservice.startRefundProcess(request).subscribe(res => {
            let refundProcessId = res;
            this.openProcessExecution(refundProcessId,1,record.channel)
        });
    }

    openProcessExecution(processId:string,type:number,channel:string){
        if(type == 0){
            this.router.navigate([`process/${channel}`],{queryParams:{processId:processId}})
        }
        else{
            this.router.navigate([`process/refund/${channel}`],{queryParams:{processId:processId}})
        }
    }

}
