import { Component, OnInit, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { channelObjectMapSource } from '@app/yibao/enums/channelObjectMapSource';
import { CreateDiagnoseComponent } from '@app/yibao/diagnose/create-diagnose-modal.component';
import { RegisterDiagnoseComponent } from '@app/yibao/diagnose/register-diagnose-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe } from '@angular/common';
import { ChannelObjectServiceProxy, QueryChannelObjectInput, QueryChannelObjectInputState } from '@shared/service-proxies/service-proxies';
import { ChannelObjectStateState } from '@shared/AppEnums';


@Component({
  templateUrl: './diagnose.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: [appModuleAnimation()]
})
export class DiagnoseComponent extends AppComponentBase implements OnInit {

  @ViewChild('createDiagnoseModal') createDiagnoseComponent: CreateDiagnoseComponent;
  @ViewChild('registerDiagnoseModal') registerDiagnoseComponent: RegisterDiagnoseComponent;

  filters: {
    keyword: string,
    source: channelObjectMapSource,
    status: QueryChannelObjectInputState
  } = <any>{ status: ChannelObjectStateState.InUse }

  ichannelObjectState = ChannelObjectStateState;

  isHost: boolean = true;
  channel: string;
  isLoading:boolean = false;

  @ViewChild('dataTable') dataTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  constructor(injector: Injector,
    private channelobjectservice: ChannelObjectServiceProxy,
    private _appSessionService: AppSessionService,
    protected activatedRoute: ActivatedRoute,
    private datepipe: DatePipe) {
    super(injector);
    if (_appSessionService.tenant) {
      this.isHost = false;
    }
    else {
      this.isHost = true;
    }

    console.log(this.activatedRoute.snapshot.url[0].path);
    this.channel = this.activatedRoute.snapshot.url[0].path;
  }

  ngOnInit() {
    //this.getList();
  }

  delete(record): void {
    this.message.confirm(
      '删除该项', '是否确定',
      (isConfirmed) => {
          if (isConfirmed) {
            this.channelobjectservice.delete(record.id).subscribe(res => {
              this.notify.info('删除成功');
              this.getList();
            });
          }
      }
  );
}

  getList(event?: LazyLoadEvent): void {
    this.isLoading = true;

    if (this.primengTableHelper.shouldResetPaging(event)) {
      this.paginator.changePage(0);

      return;
    }

    this.primengTableHelper.showLoadingIndicator();

    
    let queryChannelObjectInput: QueryChannelObjectInput = new QueryChannelObjectInput();
    
    queryChannelObjectInput.channel = this.channel;
    queryChannelObjectInput.objectType = 'Diagnose';
    queryChannelObjectInput.keyword = this.filters.keyword ? this.filters.keyword : null;
    queryChannelObjectInput.source = this._appSessionService.tenant ? 1 : 0;//this.filters.source,
    queryChannelObjectInput.state = this.filters.status.toString() == '' ? null : this.filters.status;
    queryChannelObjectInput.registered = this._appSessionService.tenant ? true : false;
    queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
    queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);

    // this.queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
    // this.queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);

    this.channelobjectservice.query(queryChannelObjectInput).finally(()=>{
      this.isLoading = false;
    }).subscribe(result => {
      console.log(result);
      this.primengTableHelper.totalRecordsCount = result.totalCount;
      this.primengTableHelper.records = result.items;
      this.primengTableHelper.hideLoadingIndicator();
    });
  }


  import(): void {
  }

  showModal(): void {
    this.createDiagnoseComponent.show(this.channel);
  }

  showRegisterModal(): void {
    this.registerDiagnoseComponent.show(this.channel);
  }
  
}
