import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";
import { AppSessionService } from "@shared/common/session/app-session.service";

/* 长兴医保 */
@Injectable()
export class ClientChangxingProxy {
    constructor(
        private httpClient: HttpClient, 
        private appSessionService: AppSessionService)
    {
    }

    private readonly remoteurl: string =
        "http://127.0.0.1:50111/api/yibao.changxing/yibao/";

    public readcard(request: any): Observable<any> {
        return this.callApi("readcard", request);
    }

    public fetchpatientinfo(request: any): Observable<any> {
        return this.callApi("fetchpatientinfo", request);
    }

    public presettle(request: any): Observable<any> {
        return this.callApi("presettle", request);
    }

    public settle(request: any): Observable<any> {
        return this.callApi("settle", request);
    }

    public refund(request: any): Observable<any> {
        return this.callApi("refund", request);
    }

    public querysettle(request: any): Observable<any> {
        return this.callApi("querysettle", request);
    }

    public confirmsettle(request: any): Observable<any> {
        return this.callApi("confirmsettle", request);
    }

    public catalogdownload(request: any): Observable<any> {
        return this.callApi("catalogdownload", request);
    }

    public catalogupload(request: any): Observable<any> {
        return this.callApi("catalogupload", request);
    }

    public diseasedownload(request: any): Observable<any> {
        return this.callApi("diseasedownload", request);
    }

    public callApi(method, request: any = null): Observable<any> {
        let suffix = this.appSessionService.tenant ? 'Tenant' : 'Application';
        let hospitalCodeKey = `Changxing.HospitalCode.${suffix}`;
        request.hospitalCode = abp.setting.get(hospitalCodeKey);
        if (request.hospitalCode == null || request.hospitalCode.length == 0) {
            abp.message.error('医疗机构编码不能为空');
            return Observable.throwError('医疗机构编码不能为空');
        }

        let url = this.remoteurl + method;
        if (request.processId) {
            url += "?seqNum=" + request.processId + request.sequenceNumber;
        }

        return this.httpClient
            .post(url, request)
            .flatMap((result: any) => {
                if (result.p1 < 0) {
                    return Observable.throwError("医保提示：" + result.p2);
                } else {
                    return Observable.of(result);
                }
            })
            .catch((response_: any) => {
                if (typeof response_ == "string") {
                    abp.message.error(response_);
                } else {
                    abp.message.error("医保发生错误：服务请求异常");
                }
                return Observable.throwError(response_);
            });
    }
}
