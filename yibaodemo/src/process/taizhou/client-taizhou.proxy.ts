import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";
import { AppSessionService } from "@shared/common/session/app-session.service";

/* 台州医保 */
@Injectable()
export class ClientTaizhouProxy {
    constructor(
        private httpClient: HttpClient, 
        private appSessionService: AppSessionService)
    {
    }

    private readonly yibaoRemoteurl: string = "http://127.0.0.1:50111/api/yibao.taizhou/yibao/";
    private readonly wisdomRemoteurl: string = "http://127.0.0.1:50111/api/yibao.taizhou/wisdom/";

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

    public confirmsettle(request: any): Observable<any> {
        return this.callApi("confirmsettle", request);
    }

    public catalogdownload(request: any): Observable<any> {
        return this.callApi("catalogdownload", request);
    }

    public catalogupload(request: any): Observable<any> {
        return this.callApi("catalogupload", request);
    }

    public catalogquery(request: any): Observable<any> {
        return this.callApi("catalogquery", request);
    }

    public diseasedownload(request: any): Observable<any> {
        return this.callApi("diseasedownload", request);
    }

    public remind(request: any): Observable<any> {
        return this.callWisdomApi("remind", request);
    }

    public audit(request: any): Observable<any> {
        return this.callWisdomApi("audit", request);
    }

    public daycheck(request: any): Observable<any> {
        return this.callApi("daycheck", request);
    }

    public transdownload(request: any): Observable<any> {
        return this.callApi("transdownload", request);
    }

    public callApi(method, request: any = null): Observable<any> {
        let suffix = this.appSessionService.tenant ? 'Tenant' : 'Application';
        let hospitalCodeKey = `Taizhou.HospitalCode.${suffix}`;
        request.hospitalCode = abp.setting.get(hospitalCodeKey);
        if (request.hospitalCode == null || request.hospitalCode.length == 0) {
            abp.message.error('医疗机构编码不能为空');
            return Observable.throwError('医疗机构编码不能为空');
        }

        let url = this.yibaoRemoteurl + method;
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
    
    public callWisdomApi(method, request: any = null): Observable<any> {
        let url = this.wisdomRemoteurl + method;
        if (request.processId) {
            url += "?seqNum=" + request.processId + request.sequenceNumber;
        }

        return this.httpClient
            .post(url, request)
            .flatMap((result: any) => {
                if (result.code == 0) {
                    return Observable.throwError("审核提示：" + result.error);
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
