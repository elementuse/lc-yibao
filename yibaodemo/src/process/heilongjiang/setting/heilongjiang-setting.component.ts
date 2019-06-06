import { Component, AfterViewChecked, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { declareReportModel } from '@app/yibao/setting/heilongjiang/models/declarationModel';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ActivatedRoute, Router } from '@angular/router'
import { DeclarationModalComponent } from './declaration-modal.component';
import { ChannelObjectServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: './heilongjiang-setting.component.html',
  animations: [appModuleAnimation()]
})
export class HeilongjiangSettingComponent extends AppComponentBase implements AfterViewChecked {

  @ViewChild('declarationModal') declarationModalComponent: DeclarationModalComponent;

  reports: Array<declareReportModel> = [];
  canShow: boolean = false;

  constructor(
    injector: Injector, 
    public yibaoservice: ChannelObjectServiceProxy,
    private heilongjiangyibaoservice:HeilongjiangYibaoService,
    private route:ActivatedRoute,
    private router:Router) {
    super(injector);

    this.route.queryParams
      .subscribe(queryParams => {
        this.canShow = queryParams.canShow;
      });
  }

  saving: boolean = false;

  ngAfterViewChecked(): void {
    //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
    $('tabset ul.nav').addClass('m-tabs-line');
    $('tabset ul.nav').addClass('m-tabs-line--primary');
    $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
  }

  showDeclaration(type: number): void {
    this.declarationModalComponent.show(type);
  }


  //定点机构参数配置
  getClinicConfigragtion(): void {
    this.heilongjiangyibaoservice.getClinicConfigragtion().subscribe(result => {
      this.reports = [];
      for (const item in result) {
        let ideclarationModel: declareReportModel = {
          name: item,
          value: result[item]
        }

        this.reports.push(ideclarationModel);
      }
    });
  }


  //经办机构参数配置
  getAgencyConfiguration(): void {
    this.heilongjiangyibaoservice.getAgencyConfiguration().subscribe(result => {
      this.reports = [];
      for (const item in result) {
        let ideclarationModel: declareReportModel = {
          name: item,
          value: result[item]
        }

        this.reports.push(ideclarationModel);
      }
    });
  }

  goBack(){
    //this.router.navigate(['/process/Heilongjiang']);
    history.go(-1);
  }

}
