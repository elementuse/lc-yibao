import { PermissionCheckerService } from 'abp-ng2-module/dist/src/auth/permission-checker.service';
import { FeatureCheckerService } from 'abp-ng2-module/dist/src/features/feature-checker.service';
import { Injectable } from '@angular/core';
import { AppMenu } from '@app/shared/layout/nav/app-menu';
import { AppMenuItem } from '@app/shared/layout/nav/app-menu-item';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class AppNavigationService {

    constructor(private _permissionService: PermissionCheckerService, private _featureService: FeatureCheckerService, private _appSessionService: AppSessionService) {

    }

    getMenu(): AppMenu {
        let root = new AppMenu('MainMenu', 'MainMenu', [
            //new AppMenuItem('Dashboard', 'Pages.Administration.Host.Dashboard', 'flaticon-line-graph', '/app/admin/hostDashboard'),
            //new AppMenuItem('Dashboard', 'Pages.Tenant.Dashboard', 'flaticon-line-graph', '/app/main/dashboard'),
            new AppMenuItem('Tenants', 'Pages.Tenants', 'flaticon-list-3', '/app/admin/tenants'),
            //new AppMenuItem('Editions', 'Pages.Editions', 'flaticon-app', '/app/admin/editions'),
            new AppMenuItem('Administration', '', 'flaticon-interface-8', '', [
                new AppMenuItem('OrganizationUnits', 'Pages.Administration.OrganizationUnits', 'flaticon-map', '/app/admin/organization-units'),
                new AppMenuItem('Roles', 'Pages.Administration.Roles', 'flaticon-suitcase', '/app/admin/roles'),
                new AppMenuItem('Users', 'Pages.Administration.Users', 'flaticon-users', '/app/admin/users'),
                new AppMenuItem('Languages', 'Pages.Administration.Languages', 'flaticon-tabs', '/app/admin/languages'),
                new AppMenuItem('AuditLogs', 'Pages.Administration.AuditLogs', 'flaticon-folder-1', '/app/admin/auditLogs'),
                new AppMenuItem('Maintenance', 'Pages.Administration.Host.Maintenance', 'flaticon-lock', '/app/admin/maintenance'),
                // new AppMenuItem('Subscription', 'Pages.Administration.Tenant.SubscriptionManagement', 'flaticon-refresh', '/app/admin/subscription-management'),
                // new AppMenuItem('VisualSettings', 'Pages.Administration.UiCustomization', 'flaticon-medical', '/app/admin/ui-customization'),
                new AppMenuItem('Settings', 'Pages.Administration.Host.Settings', 'flaticon-settings', '/app/admin/hostSettings'),
                new AppMenuItem('Settings', 'Pages.Administration.Tenant.Settings', 'flaticon-settings', '/app/admin/tenantSettings')
            ]),
            //new AppMenuItem('DemoUiComponents', 'Pages.DemoUiComponents', 'flaticon-shapes', '/app/admin/demo-ui-components')
        ]);

        if (!this._appSessionService.tenant) {
            root.items.push(
                 new AppMenuItem('台州医保', 'His_Management', 'flaticon-interface-8', '', [
                     new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Taizhou'),
                     new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Taizhou'),
                     new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Taizhou'),
                 ]),
            );
        }
        else {
            // 目前需要为每种医保手动注册菜单
            // TODO: 根据metadata自动生成菜单
            root.items.push(new AppMenuItem('保险结算列表', 'His_Management', 'flaticon-map', '/app/yibao/processlist'));

            if (this._featureService.isEnabled('Taizhou')) {
                root.items.push(new AppMenuItem('台州医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Taizhou'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Taizhou'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Taizhou'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Taizhou'),
                    new AppMenuItem('对账', 'His_Management', 'flaticon-map', '/app/yibao/check/Taizhou')
                ]));
            }

        }
        return root;
    }

    checkChildMenuItemPermission(menuItem): boolean {

        for (let i = 0; i < menuItem.items.length; i++) {
            let subMenuItem = menuItem.items[i];

            if (subMenuItem.permissionName && this._permissionService.isGranted(subMenuItem.permissionName)) {
                return true;
            }

            if (subMenuItem.items && subMenuItem.items.length) {
                return this.checkChildMenuItemPermission(subMenuItem);
            } else if (!subMenuItem.permissionName) {
                return true;
            }
        }

        return false;
    }
}
