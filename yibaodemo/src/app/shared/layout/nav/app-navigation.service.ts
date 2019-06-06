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
            root.items.push(new AppMenuItem('黑龙江医保', 'His_Management', 'flaticon-interface-8', '', [
                new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Heilongjiang'),
            ]),
                new AppMenuItem('江西景德镇医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Jingdezhen'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Jingdezhen'),
                ]),
                new AppMenuItem('泰康齿科保险', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/TaikangKq'),
                ]),
                new AppMenuItem('龙岩医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Longyan'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Longyan'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Longyan')
                 ]),
                new AppMenuItem('深圳医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/ShenzhenYibao'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/ShenzhenYibao'),
                ]),
                new AppMenuItem('宁波医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Ningbo'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Ningbo'),
                    new AppMenuItem('科室配置', 'His_Management', 'flaticon-map', '/app/yibao/department/Ningbo')
                ]),
                new AppMenuItem('测试医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Test'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Test')
                ]),
                new AppMenuItem('福州医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Fujianfuzhou'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Fujianfuzhou'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Fujianfuzhou')
                 ]),
                 new AppMenuItem('杭州医保', 'His_Management', 'flaticon-interface-8', '', [
                     new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Hangzhou'),
                     new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Hangzhou'),
                 ]),
                 new AppMenuItem('长兴医保', 'His_Management', 'flaticon-interface-8', '', [
                     new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Changxing'),
                     new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Changxing'),
                     new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Changxing'),
                 ]),
                 new AppMenuItem('宁波医保', 'His_Management', 'flaticon-interface-8', '', [
                     //new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Ningbo'),
                     new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Ningbo'),
                     new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Ningbo'),
                 ]),
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

            if (this._featureService.isEnabled('Heilongjiang')) {
                root.items.push(new AppMenuItem('黑龙江医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Heilongjiang'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Heilongjiang'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Heilongjiang'),
                ]));
            }
            if (this._featureService.isEnabled('Jingdezhen')) {
                root.items.push(new AppMenuItem('江西景德镇医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Jingdezhen'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Jingdezhen'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Jingdezhen'),
                    new AppMenuItem('诊所配置', 'His_Management', 'flaticon-map', '/app/yibao/department/Jingdezhen')
                ]));
            }
            if (this._featureService.isEnabled('TaikangKq')) {
                root.items.push(new AppMenuItem('泰康齿科保险', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('保险配置', 'His_Management', 'flaticon-map', '/app/yibao/setting'),
                ]));
            }
            if (this._featureService.isEnabled('TaikangKq2')) {
                root.items.push(new AppMenuItem('泰康齿科保险2', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/TaikangKq2'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/TaikangKq2'),
                ]));
            }
            if (this._featureService.isEnabled('Longyan')) {
                root.items.push(new AppMenuItem('龙岩医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Longyan'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Longyan'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Longyan')
                ]));
            }
            if (this._featureService.isEnabled('ShenzhenYibao')) {
                root.items.push(new AppMenuItem('深圳医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/ShenzhenYibao'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/ShenzhenYibao'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/ShenzhenYibao'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/ShenzhenYibao')
                ]));
            }
            if (this._featureService.isEnabled('Ningbo')) {
                root.items.push(new AppMenuItem('宁波医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Ningbo')
                ]));
            }
            if (this._featureService.isEnabled('Qingdao')) {
                root.items.push(new AppMenuItem('青岛医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Qingdao'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Qingdao'),
                ]));
            }
            if (this._featureService.isEnabled('Xinzhou')) {
                root.items.push(new AppMenuItem('忻州医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Xinzhou'),
                    new AppMenuItem('诊所配置', 'His_Management', 'flaticon-map', '/app/yibao/department/Xinzhou')
                ]));
            }

            if (this._featureService.isEnabled('Test')) {
                root.items.push(new AppMenuItem('测试医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Test'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Test'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Test')
                ]));
            }
            if (this._featureService.isEnabled('Fujianfuzhou')) {
                root.items.push(new AppMenuItem('福州医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Fujianfuzhou'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Fujianfuzhou'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Fujianfuzhou')
                ]));
            }
            if (this._featureService.isEnabled('Hangzhou')) {
                root.items.push(new AppMenuItem('杭州医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Hangzhou'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Hangzhou'),
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Hangzhou'),
                ]));
            }
            if (this._featureService.isEnabled('Changxing')) {
                root.items.push(new AppMenuItem('长兴医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('医保配置', 'His_Management', 'flaticon-map', '/app/yibao/setting/Changxing'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Changxing'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Changxing')
                ]));
            }
            if (this._featureService.isEnabled('Ningbo')) {
                root.items.push(new AppMenuItem('宁波医保', 'His_Management', 'flaticon-interface-8', '', [
                    new AppMenuItem('员工配置', 'His_Management', 'flaticon-map', '/app/yibao/provider/Ningbo'),
                    new AppMenuItem('收费项配置', 'His_Management', 'flaticon-map', '/app/yibao/chargeitem/Ningbo'),
                    new AppMenuItem('诊断配置', 'His_Management', 'flaticon-map', '/app/yibao/diagnose/Ningbo')
                ]));
            }
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
