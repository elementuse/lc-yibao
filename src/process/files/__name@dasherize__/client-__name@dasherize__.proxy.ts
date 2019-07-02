import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";
import { AppSessionService } from "@shared/common/session/app-session.service";

/* <%= display %>医保 */
@Injectable()
export class Client<%= classify(name) %>Proxy {
    constructor(
        private httpClient: HttpClient, 
        private appSessionService: AppSessionService)
    {
    }

    private readonly yibaoRemoteurl: string = "http://127.0.0.1:50111/api/yibao.<%= dasherize(name) %>/yibao/";<% if(wisdom) { %>
    private readonly wisdomRemoteurl: string = "http://127.0.0.1:50111/api/yibao.<%= dasherize(name) %>/wisdom/";<% } %>

    public readcard(request: any): Observable<any> {
        return this.callApi("readcard", request);
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
    <% if(wisdom) { %>
    public remind(request: any): Observable<any> {
        return this.callWisdomApi("remind", request);
    }

    public audit(request: any): Observable<any> {
        return this.callWisdomApi("audit", request);
    }<% } %>

    public callApi(method, request: any = null): Observable<any> {
        let suffix = this.appSessionService.tenant ? 'Tenant' : 'Application';
        let hospitalCodeKey = `<%= classify(name) %>.HospitalCode.${suffix}`;
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
                if (!result.isSuccess) {
                    return Observable.throwError(result.resultMessage);
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
    <% if(wisdom) { %>
    public callWisdomApi(method, request: any = null): Observable<any> {
        let url = this.wisdomRemoteurl + method;
        if (request.processId) {
            url += "?seqNum=" + request.processId + request.sequenceNumber;
        }

        return this.httpClient
            .post(url, request)
            .flatMap((result: any) => {
                if (!result.isSuccess) {
                    return Observable.throwError("审核提示：" + result.resultMessage);
                } else {
                    return Observable.of(result);
                }
            })
            .catch((response_: any) => {
                if (typeof response_ == "string") {
                    abp.message.error(response_);
                } else {
                    abp.message.error("医保审核发生错误：服务请求异常");
                }
                return Observable.throwError(response_);
            });
    }<% } %>
}
