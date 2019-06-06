import { Component, OnInit, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { getImportInfoInput } from '@app/yibao/models/getImportInfoInput';
import { queryChannelObjectInput } from '@app/yibao/models/queryChannelObjectInput';
import { channelObjectMapSource } from '@app/yibao/enums/channelObjectMapSource';
import { channelObjectState } from '@app/yibao/enums/channelObjectState';
import { CreateDepartmentComponent } from '@app/yibao/department/create-department-modal.component';
import { RegisterDepartmentComponent } from '@app/yibao/department/register-department-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe } from '@angular/common';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, QueryChannelObjectInput, QueryChannelObjectInputState,GetImportInfoInput } from '@shared/service-proxies/service-proxies';


@Component({
  templateUrl: './department.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: [appModuleAnimation()]
})
export class DepartmentComponent extends AppComponentBase implements OnInit {

  @ViewChild('createDepartmentModal') createDepartmentComponent: CreateDepartmentComponent;
  @ViewChild('registerDepartmentModal') registerDepartmentComponent: RegisterDepartmentComponent;

  filters: {
    keyword: string,
    source: channelObjectMapSource,
    status: QueryChannelObjectInputState
  } = <any>{};

  ichannelObjectState = channelObjectState;


  loading: boolean = false;
  isHost: boolean = true;
  channel: string;
  isLoading:boolean = false;


  @ViewChild('dataTable') dataTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  constructor(injector: Injector,
    private yibaoservice: ChannelObjectServiceProxy,
    private heilongjiangyibaoservice:HeilongjiangYibaoService,
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

    this.channel = this.activatedRoute.snapshot.url[0].path;
  }

  ngOnInit() {
    //this.getList();
  }

  // getLis(){
  //   alert(this.filters.status);
  // }

  delete(record): void {
    this.message.confirm(
      '删除该项', '是否确定',
      (isConfirmed) => {
          if (isConfirmed) {
            this.yibaoservice.delete(record.id).subscribe(res => {
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
    queryChannelObjectInput.objectType = 'Department';
    queryChannelObjectInput.keyword = this.filters.keyword ? this.filters.keyword : null;
    queryChannelObjectInput.source = this._appSessionService.tenant ? 1 : 0;//this.filters.source,
    queryChannelObjectInput.state = this.filters.status? this.filters.status:null ;
    queryChannelObjectInput.registered = this._appSessionService.tenant ? true : false;
    queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
    queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event)

    // this.queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
    // this.queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);

    this.yibaoservice.query(queryChannelObjectInput).finally(()=>{
      this.isLoading = false;
    }).subscribe(result => {
      this.primengTableHelper.totalRecordsCount = result.totalCount;
      this.primengTableHelper.records = result.items;
      this.primengTableHelper.hideLoadingIndicator();
    });

  }


  import(): void {
    this.loading = true;
    let request: GetImportInfoInput =  new GetImportInfoInput();
    request.channel = this.channel;
    request.objectType = "Department";
    request.objectSubType = '';
    request.registered = false;
    this.heilongjiangyibaoservice.importInfo(request).finally(() => {
      this.loading = false;
    }).subscribe(result => {
      this.notify.info('导入完成');
    });
  }

  showModal(): void {
    this.createDepartmentComponent.show(this.channel);
  }

  showRegisterModal(): void {
    this.registerDepartmentComponent.show(this.channel);
  }
}
