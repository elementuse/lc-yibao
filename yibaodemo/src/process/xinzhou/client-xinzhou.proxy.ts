import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";

/* 忻州医保 */
@Injectable()
export class ClientXinzhouProxy {
    constructor(private httpClient: HttpClient) {}

    private readonly xinzhouremoteurl: string =
        "http://127.0.0.1:50111/api/yibao.shandong/yibao/";

    public readcard(request: any): Observable<any> {
        return this.callLocal("readcard", request);
    }

    public initmz(request: any): Observable<any> {
        return this.callLocal("initmz", request);
    }

    public fymx(request: any): Observable<any> {
        return this.callLocal("fymx", request);
    }

    public settlepre(request: any): Observable<any> {
        return this.callLocal("settlepre", request);
    }

    public settlereal(request: any): Observable<any> {
        return this.callLocal("settlereal", request);
    }

    public destroy(request: any): Observable<any> {
        return this.callLocal("destroy", request);
    }

    public print(request: any): Observable<any> {
        return this.callLocal("print", request);
    }

    public addyyxm(request: any): Observable<any> {
        return this.callLocal("addyyxm", request);
    }

    public callLocal(method, request: any = null): Observable<any> {
        let url = this.xinzhouremoteurl + method;
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
                return Observable.throwError(response_);//<Observable<void>>(<any>Observable.throw(response_));
            });
    }
}
