import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { declareReportModel } from '@app/yibao/setting/heilongjiang/models/declarationModel';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ModalDirective } from 'ngx-bootstrap';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DatePipe } from '@angular/common';
import { ChannelObjectServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from'moment'

@Component({
  selector: 'declarationModal',
  templateUrl: './declaration-modal.component.html'
})
export class DeclarationModalComponent extends AppComponentBase implements OnInit {

  @ViewChild('declarationModal') modal: ModalDirective;
  datestr: string = "";
  constructor(
    public yibaoservice: ChannelObjectServiceProxy, 
    private heilongjiangyibaoservice:HeilongjiangYibaoService,
    private datepipe: DatePipe, 
    injector: Injector) {
    super(injector);
  }

  reports: Array<declareReportModel> = [];
  active: boolean = false;
  saving: boolean = false;
  text: string = "正在申报...";
  isBubao: boolean = false;
  months: Array<string> = [];
  canreport:boolean = false;

  ngOnInit() {
    //this.queryMonthlyReport();
  }

  queryMonthlyReport(): void {
    this.reports = [];
    this.canreport = false;
    if (this.datestr != "") {
      let request = { p1: this.datestr };
      this.heilongjiangyibaoservice.queryMonthlyReport(request).subscribe(result => {
        for (const item in result) {
          let ideclarationModel: declareReportModel = {
            name: item,
            value: result[item]
          }
          this.reports.push(ideclarationModel);
        }
        this.canreport = true;
      });
    }
  }

  queryMonthlyBubao(): void {
    this.datestr = '';
    this.months = [];
    let request = { p1: new Date().getFullYear() - 1 };
    this.heilongjiangyibaoservice.queryMonthlyBubao(request).subscribe(result => {
      result.p1.forEach(item => {
        this.months.push(item);
      });

    });
  }

  //模态窗展示时查询数据
  show(type: number): void {
    const self = this;
    self.active = true;
    this.reports = [];
    if (type == 0) {
      this.isBubao = false;
      this.datestr = moment().subtract(1,'months').format('YYYYMM'); 
      // this.datestr = this.datepipe.transform(new Date(), 'yyyyMM');
      self.queryMonthlyReport();
    }
    else {
      this.isBubao = true;
      self.queryMonthlyBubao();
    }
    self.modal.show();

  }

  close(): void {
    this.active = false;
    this.modal.hide();
    this.canreport = false;
  }


  //申报费用
  declare(): void {
    let request = {
      p1: this.datestr,
      p2: this.isBubao ? '2' : '1',
      p3: '0001'
    }
    this.heilongjiangyibaoservice.declareMonthlyReport(request)
      .finally(() => this.saving = false)
      .subscribe(result => {
        if (this.isBubao) {
          this.queryMonthlyBubao();
        }
        this.notify.info('申报成功');
        this.close();
      });
  }




}
