import { PermissionCheckerService } from 'abp-ng2-module/dist/src/auth/permission-checker.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot,ActivatedRoute } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class AccountRouteGuard implements CanActivate {

    token:string ;
    constructor(
        private _permissionChecker: PermissionCheckerService,
        private _router: Router,
        private _sessionService: AppSessionService,
        private _activatedRoute:ActivatedRoute
    ) { 

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

        // this._activatedRoute.queryParams.subscribe(params => {
        //     if(params.token){
        //         alert(params.token);
        //         this.hastoken = true;
        //     }
        // })

        //this.token = this._activatedRoute.queryParams['token'];
        //alert('account-route-guard' + location.href);
        if(location.href.includes('token')){
            return true;
        }

        if (this._sessionService.user) {
            this._router.navigate([this.selectBestRoute()]);
            return false;
        }

        return true;
    }

    selectBestRoute(): string {

        if (this._permissionChecker.isGranted('Pages.Administration.Host.Dashboard')) {
            return '/app/admin/hostDashboard';
        }

        if (this._permissionChecker.isGranted('Pages.Tenant.Dashboard')) {
            return '/app/main/dashboard';
        }

        return '/app/notifications';
    }
}
