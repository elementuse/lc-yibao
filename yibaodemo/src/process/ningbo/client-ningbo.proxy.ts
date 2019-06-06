import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";

/* 宁波医保 */
@Injectable()
export class ClientNingboProxy {
    constructor(private httpClient: HttpClient) { }
    /*宁波*/
    
    private readonly ningboremoteurl: string = 'http://127.0.0.1:50111/api/yibao.Ningbo/ningboyibao/';

    //门诊读卡
    public ReadCard(request: any): Observable<any> {
        let method = 'MzReadCard';
        return this.callRemoteService(this.ningboremoteurl, method, request);
    }

    //门诊挂号
    public Register(request: any): Observable<any> {
        let method: string = "MzRegister";
        return this.callRemoteService(this.ningboremoteurl, method, request);
    }

    //门诊预收费
    public Presettlement(request: any): Observable<any> {
        let method: string = "Mzsfyjs";
        return this.callRemoteService(this.ningboremoteurl, method, request);
    }

    //门诊收费
    public Settlement(request: any): Observable<any> {
        let method: string = "MzCharge";
        return this.callRemoteService(this.ningboremoteurl, method, request);
    }

    //门诊退费
    public Refund(request: any): Observable<any> {
        let method: string = "Mzsfcx";
        return this.callRemoteService(this.ningboremoteurl, method, request);
    }

    public callRemoteService(url: string, method: string, request: any = null): Observable<any> {
        return this.httpClient.post(url + method, request)
            .catch((response_: any) => {
                console.error(response_);
                abp.message.error("发生错误：服务请求异常");
                return <Observable<void>><any>Observable.throw(response_);
            });
    }

    public callRemoteServiceget(url: string, method: string, request: any = null): Observable<any> {
        let options = { params: request }
        return this.httpClient.get(url + method, options)
            .catch((response_: any) => {
                console.error(response_);
                abp.message.error("发生错误：服务请求异常");
                return <Observable<void>><any>Observable.throw(response_);
            });
    }
}
