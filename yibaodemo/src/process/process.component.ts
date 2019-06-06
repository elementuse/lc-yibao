import { Component, OnInit,Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SubscriptionStartType } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';
import * as moment from 'moment';

@Component({
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.css']
})
export class ProcessComponent extends AppComponentBase implements OnInit {

  subscriptionStartType = SubscriptionStartType;

  constructor(injector: Injector,private _appSessionService: AppSessionService) {
    super(injector);
   }

  ngOnInit() {
  }

  subscriptionStatusBarVisible(): boolean {
    return this._appSessionService.tenantId > 0 &&
        (this._appSessionService.tenant.isInTrialPeriod ||
            this.subscriptionIsExpiringSoon());
}

subscriptionIsExpiringSoon(): boolean {
    if (this._appSessionService.tenant.subscriptionEndDateUtc) {
        return moment().utc().add(AppConsts.subscriptionExpireNootifyDayCount, 'days') >= moment(this._appSessionService.tenant.subscriptionEndDateUtc);
    }

    return false;
}

}
