import { Component, OnInit, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/components/paginator/paginator';
import { Table } from 'primeng/components/table/table';
import { channelObjectMapSource } from '@app/yibao/enums/channelObjectMapSource';
import { CreateItemComponent } from '@app/yibao/chargeitem/create-item-modal.component';
import { RegisterItemComponent } from '@app/yibao/chargeitem/register-item-modal.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, Observable } from "rxjs/Rx";
import { DatePipe } from '@angular/common';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, QueryChannelObjectInput, QueryChannelObjectInputState, GetImportInfoInput, RegisteredChannelObjectInput, ImportInputOfRegisteredChannelObjectInput, GetDefinitionInput, QuerySyncToYibaoInput, ChangeStateInput } from '@shared/service-proxies/service-proxies';
import { ChannelObjectStateState } from '@shared/AppEnums';
import * as XLSX from 'xlsx';
import { ImportErrorModalComponent } from './importError/import-error-modal.component';
import { ChargeItemServiceFactory } from '@shared/chargeItem.factory';
import { throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TaizhouImportModalComponent } from '@app/yibao/chargeitem/taizhou/taizhou-importmodal.component';


@Component({
  templateUrl: './chargeitem.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: [appModuleAnimation()]
})
export class ChargeitemComponent extends AppComponentBase implements OnInit {

  @ViewChild('createItemModal') createItemComponent: CreateItemComponent;
  @ViewChild('registerItemModal') registerItemComponent: RegisterItemComponent;
  @ViewChild('taizhouImportModal') taizhouImportModalComponent: TaizhouImportModalComponent;
  @ViewChild('importErrorModal') importErrorModalComponent: ImportErrorModalComponent;
  @ViewChild('dataTable') dataTable: Table;
  @ViewChild('paginator') paginator: Paginator;


  filters: {
    keyword: string,
    source: channelObjectMapSource,
    status: QueryChannelObjectInputState
  } = <any>{}

  ichannelObjectState = ChannelObjectStateState;

  loading: boolean = false;
  isHost: boolean = true;
  protected subscription: Subscription;
  channel: string;
  isLoading: boolean = false;
  objectType: string = 'ChargeItem';
  inputdata = [];
  erroritems = [];
  isSync: boolean = false;
  importByExcel: boolean = false;
  isAudit: boolean = false;

  constructor(
    injector: Injector,
    private yibaoservice: ChannelObjectServiceProxy,
    private heilongjiangyibaoservice: HeilongjiangYibaoService,
    private _appSessionService: AppSessionService,
    public chargeitemfactory: ChargeItemServiceFactory,
    protected activatedRoute: ActivatedRoute,
    private http: HttpClient,
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
    this.getDefinition();
  }

  delete(record): void {

    this.message.confirm(
      '删除该项', '是否确定',
      (isConfirmed) => {
          if (isConfirmed) {
            if (this._appSessionService.tenant) {
              if (this.channel == 'Heilongjiang') {
                this.heilongjiangdelete(record);
              }
              else {
                let chargeitemService = this.chargeitemfactory.GetService(this.channel);
                let unRegisterPromise = chargeitemService == null ? Promise.resolve() : chargeitemService.UnRegisterToYibao(record);
                let thisref = this;
                unRegisterPromise.then(function(){
                  thisref.yibaoservice.delete(record.id).subscribe(res => {
                    thisref.notify.info('删除成功');
                    thisref.getList();
                  });
                });
              }
            }
            else {
              this.yibaoservice.delete(record.id).subscribe(res => {
                this.notify.info('删除成功');
              });
            }
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
    queryChannelObjectInput.objectType = this.objectType;
    queryChannelObjectInput.keyword = this.filters.keyword ? this.filters.keyword : null;
    queryChannelObjectInput.source = this._appSessionService.tenant ? 1 : 0;//this.filters.source,
    queryChannelObjectInput.state = this.filters.status ? this.filters.status : null;
    queryChannelObjectInput.registered = this._appSessionService.tenant ? true : false;
    queryChannelObjectInput.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
    queryChannelObjectInput.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event)

    this.yibaoservice.query(queryChannelObjectInput).finally(() => {
      this.isLoading = false;
      this.primengTableHelper.hideLoadingIndicator();
    })
      .subscribe(result => {
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        this.primengTableHelper.records = result.items;
      });

  }


  import(): void {
    if (this.channel == 'Taizhou') {
      this.taizhouImportModalComponent.show();
      return;
    }
    this.primengTableHelper.showLoadingIndicator();
    let request: GetImportInfoInput = new GetImportInfoInput();
    request.channel = this.channel;
    request.objectType = this.objectType;
    request.objectSubType = null;
    request.registered = false;
    //request.initialDate = 1;
    this.heilongjiangyibaoservice.importInfo(request)
      .finally(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
      .subscribe(result => {
        this.notify.info('导入完成');
        this.getList();
      }, (error => {
        this.notify.error('导入失败');
      })
      );
  }

  importRegistered(): void {
    this.primengTableHelper.showLoadingIndicator();
    let request: GetImportInfoInput = new GetImportInfoInput();
    request.channel = this.channel;
    request.objectType = this.objectType;
    request.objectSubType = null;
    request.registered = true;
    this.heilongjiangyibaoservice.importRegistered(request)
      .finally(() => {
        this.primengTableHelper.hideLoadingIndicator();
      }).subscribe(result => {
        this.notify.info('导入完成');
        this.getList();
      });
  }

  showModal(): void {
    this.createItemComponent.show(this.channel);
  }

  showRegisterModal(): void {
    this.registerItemComponent.show(this.channel);
  }

  heilongjiangdelete(record): void {
    let request = {
      p1: record.fields.chargeItemType,
      p2: record.hisObjectId,
      p3: this.datepipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss')
    }
    this.heilongjiangyibaoservice.deleteSXml(request).mergeMap(res => {
      if (res.error = "") {
        return Observable.create(observer => observer.next(res.error));
      }
      else {
        return this.yibaoservice.delete(record.id)
      }
    }).subscribe((res: any) => {
      if (res != null) {
        this.message.error(res, '删除失败')
      }
      else {
        this.notify.info('删除成功');
        this.getList();
      }
    });
  }


  public getDefinition() {
    let request: GetDefinitionInput = new GetDefinitionInput();
    request.channel = this.channel;
    request.objectType = this.objectType;
    this.yibaoservice.getDefinition(request).subscribe(res => {
      if (res.syncToYibao) {
        this.isSync = true;
      }
      if (res.importByExcel) {
        this.importByExcel = true;
      }
      if (res.auditByYibao) {
        this.isAudit = true;
      }
    });
  }

  public async syncToYibao() {
    try {
      abp.ui.setBusy();
      let request: QuerySyncToYibaoInput = new QuerySyncToYibaoInput();
      request.channel = this.channel;
      request.objectType = this.objectType;
      let dtos = await this.yibaoservice.querySyncToYibao(request).toPromise();
      for (const item of dtos) {
        let changeStateInput: ChangeStateInput = new ChangeStateInput();
        changeStateInput.id = item.id;
        switch(item.state) {
          case ChannelObjectStateState.WaitingForSync:
            await this.chargeitemfactory.GetService(this.channel).RegisterToYibao(item);
            if (this.isAudit) {
              changeStateInput.state = ChannelObjectStateState.WaitingForApproval;
              await this.yibaoservice.changeState(changeStateInput).toPromise();
            }
            else {
              changeStateInput.state = ChannelObjectStateState.InUse;
              await this.yibaoservice.changeState(changeStateInput).toPromise();
            }
            break;

          case ChannelObjectStateState.WaitingForUpdate:
            await this.chargeitemfactory.GetService(this.channel).UpdateToYibao(item);
            changeStateInput.state = ChannelObjectStateState.InUse;
            await this.yibaoservice.changeState(changeStateInput).toPromise();
            break;
            
          case ChannelObjectStateState.WaitingForApproval:
            let approved = await this.chargeitemfactory.GetService(this.channel).ApproveToYibao(item);
            changeStateInput.state = approved ? ChannelObjectStateState.InUse : ChannelObjectStateState.NotApproved;
            await this.yibaoservice.changeState(changeStateInput).toPromise();
            break;
        }
      }

      abp.message.success('同步成功');
    } catch (error) {
      abp.message.error(error, '同步失败');
    } finally {
      abp.ui.clearBusy();
      this.getList()
    }
  }

  // 导入
  public daoru(evt: any, data: Array<any>) {
    // const started = Date.now();
    /* wire up file reader */
    // const target: DataTransfer = <DataTransfer>(evt.target);
    const target: DataTransfer = <DataTransfer>(evt.target);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      this.readExcel(e, evt, data);
    }
    reader.onerror = (e: any) => {
      abp.message.error(e, '错误');
      abp.ui.clearBusy();
    }
    reader.onloadstart = () => {
      abp.ui.setBusy();
    }
    reader.onloadend = () => {
      abp.ui.clearBusy();
    }
    reader.readAsBinaryString(target.files[0]);
    // const elapsed = Date.now() - started;  //可计算出请求所消耗时间
    // const msg = `Import Excel in ${elapsed} ms.`;
  }

  private async readExcel(e: any, evt: any, data: any) {
    let list = new Array<RegisteredChannelObjectInput>();
    let extraFieds = [];
    let transcodeFieds = [];
    let requiredfields = [];

    /* read workbook */
    const bstr: string = e.target.result;
    const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

    /* grab first sheet */
    const wsname: string = wb.SheetNames[0];
    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
    try {
      /* save data */
      this.inputdata = (XLSX.utils.sheet_to_json(ws, { header: 1 }));
      if (this.inputdata.length > 1) {
        for (let i = 0; i < this.inputdata.length; i++) {
          let res = this.inputdata[i];
          //第一行处理表头
          if (i == 0) {
            let tempFields = res.slice(0);
            //比较表头，有错误就抛出
            if (JSON.stringify(res.sort()) != JSON.stringify(data.sort())) {
              throw '文件表头有错误，请检查表头'
            }
            for (let index = 0; index < tempFields.length; index++) {
  
              //加入必填项
              if (tempFields[index].includes('*')) {
                requiredfields.push(index);
              }
              let e = tempFields[index];
  
              //加入transcodeFields
              if (e.includes('#')) {
                let startindex = e.indexOf('#');
                let endindex = e.indexOf(')');
                let result = e.substring(startindex + 1, endindex)
                e = e.replace('#', '');
                transcodeFieds.push(result);
              }
              extraFieds.push(e);
            }
            console.log(extraFieds);
          } else {

            //检查整行为空的情况
            if (res.every(this.checknull)) {
                continue;
            }
  
            //检查必填项
            requiredfields.forEach((r) => {
              if (!res[r]) {
                throw `第${i + 1}行第${r + 1}列必填项为空`;
              }
            });
            let dto = new RegisteredChannelObjectInput();
            let request = {
              hisObjectName: res[2],
              channelObjectId: res[0],
              channelObjectName: res[1],
              fields: {},
              channel: this.channel,
              objectType: this.objectType
            }
  
  
            //填充fields
            for (let index = 3; index < res.length; index++) {
              const element = res[index];
              let startindex = extraFieds[index].indexOf('(');
              let endindex = extraFieds[index].indexOf(')');
              request.fields[extraFieds[index].substring(startindex + 1, endindex)] = element
            }
  
            Object.assign(dto, request);
            list.push(dto);
          };
        }
  
        if (list.length > 0) {
          let request: ImportInputOfRegisteredChannelObjectInput = new ImportInputOfRegisteredChannelObjectInput();
          request.channel = this.channel;
          request.objectType = this.objectType;
          request.channelObjects = list;
          request.transcodeFields = transcodeFieds;
          this.yibaoservice.excelImportRegistered(request).subscribe(res => {
            if (res.failedRecords.length > 0) {
              this.erroritems = res.failedRecords;
              this.importErrorModalComponent.show();
            }
            else {
              this.message.success('导入成功');
            }
            this.getList();
          }) 
        }else{
          throw '内容为空，请检查';
        }
      }else{
        throw '内容为空，请检查';
      }

    }
    catch (error) {
      abp.message.error(error || "", '错误');
    }finally{
      evt.target.value = "" // 清空
    }
  }

  public saveExcel() {
    let link = document.createElement("a");
    link.download = `${this.channel}导入模板`;
    link.href = `assets/excel-template/${this.channel}.xlsx`;
    link.click();
    link.remove();
    // this.getTemplate();
  }

  public getTemplate(evt: any) {
    let data = [];

    //读取模板
    this.http.get(`assets/excel-template/${this.channel}.xlsx`, { observe: 'response', responseType: 'blob' }).subscribe(res => {
      let blob = new Blob([res.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        const wb: XLSX.WorkBook = XLSX.read(reader.result, { type: 'binary' });

        /* grab first sheet */
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* save data */
        data = (XLSX.utils.sheet_to_json(ws, { header: 1 }));
        console.log(data);

        //读取上传文件
        this.daoru(evt, data[0]);
      }
      reader.onerror = (e: any) => {
        abp.message.error(e, '错误');
        abp.ui.clearBusy();
      }
      reader.readAsBinaryString(blob);
    })
  }

  //检查是否为空
  public checknull(val){
    return val == null || typeof(val) == 'string' ? val.trim() == "" : false;
  }
}
