import { UtilsService } from 'abp-ng2-module/dist/src/utils/utils.service';
import { AppConsts } from '@shared/AppConsts';

export class SignalRHelper {
    static initSignalR(callback: () => void): void {

        jQuery.getScript(AppConsts.remoteServiceBaseUrl + '/signalr/hubs', () => {

            $.connection.hub.url = AppConsts.remoteServiceBaseUrl + '/signalr';

            const encryptedAuthToken = new UtilsService().getCookieValue(AppConsts.authorization.encrptedAuthTokenName);
            $.connection.hub.qs = AppConsts.authorization.encrptedAuthTokenName + '=' + encodeURIComponent(encryptedAuthToken);

            jQuery.getScript(AppConsts.appBaseUrl + '/assets/abp/abp.signalr.js');

            callback();
        });
    }
}
