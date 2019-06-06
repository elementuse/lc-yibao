import { NgModule } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ProcessListComponent } from '@app/yibao/processlist/processlist.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
          path: '',
          children: [
            { path: 'setting', loadChildren:'app/yibao/setting/setting.module#SettingModule'},
            { path: 'chargeitem', loadChildren:'app/yibao/chargeitem/chargeitem.module#ChargeItemModule'},
            { path: 'provider', loadChildren:'app/yibao/provider/provider.module#ProviderModule'},
            { path: 'department', loadChildren:'app/yibao/department/department.module#DepartmentModule'},
            { path: 'diagnose', loadChildren:'app/yibao/diagnose/diagnose.module#DiagnoseModule'},
            { path: 'check', loadChildren:'app/yibao/check/check.module#CheckModule'},
            { path: 'processlist', component:ProcessListComponent},
          ]
      }])
  ],
  declarations: [],
  exports:[
    RouterModule
   ]
})
export class YibaoRoutingModule { 
  constructor(
    private router: Router
) {
    router.events.subscribe((event) => {
        this.hideOpenDataTableDropdownMenus();

        if (event instanceof NavigationEnd) {
            window.scroll(0, 0);
        }
    });
}

hideOpenDataTableDropdownMenus(): void {
    let $dropdownMenus = $('.dropdown-menu.tether-element');
    $dropdownMenus.css({
        'display': 'none'
    });
}
}
