import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";

/* 杭州医保 */
@Injectable()
export class ClientHangzhouProxy {
    constructor(private httpClient: HttpClient)
    {
    }

    private readonly remoteurl: string =
        "http://127.0.0.1:50111/api/yibao.hangzhou/yibao/";

    public readcard(request: any): Observable<any> {
        return this.callApi("readcard", request);
    }

    public fetchpatientinfo(request: any): Observable<any> {
        return this.callApi("fetchpatientinfo", request);
    }

    public register(request: any): Observable<any> {
        return this.callApi("register", request, false);
    }

    public prescriptionupload(request: any): Observable<any> {
        return this.callApi("prescriptionupload", request);
    }

    public prescriptioncheck(request: any): Observable<any> {
        return this.callApi("prescriptioncheck", request, false);
    }

    public prescriptioncancel(request: any): Observable<any> {
        return this.callApi("prescriptioncancel", request);
    }

    public presettlement(request: any): Observable<any> {
        return this.callApi("presettlement", request);
    }

    public settlement(request: any): Observable<any> {
        return this.callApi("settlement", request);
    }

    public querySettlement(request: any): Observable<any> {
        return this.callApi("querySettlement", request);
    }

    public refund(request: any): Observable<any> {
        return this.callApi("refund", request);
    }

    public drugdownload(request: any): Observable<any> {
        return this.callApi("drugdownload", request);
    }

    public diagnosisdownload(request: any): Observable<any> {
        return this.callApi("diagnosisdownload", request);
    }

    public materialdownload(request: any): Observable<any> {
        return this.callApi("materialdownload", request);
    }

    public diseasedownload(request: any): Observable<any> {
        return this.callApi("diseasedownload", request);
    }

    public callApi(method, request: any = null, showError: boolean = true): Observable<any> {
        let url = this.remoteurl + method;
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
                if (showError) {
                    if (typeof response_ == "string") {
                        abp.message.error(response_);
                    } else {
                        abp.message.error("医保发生错误：服务请求异常");
                    }
                }
                return Observable.throwError(response_);
            });
    }
}
