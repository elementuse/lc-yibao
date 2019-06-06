import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import "rxjs/add/observable/forkJoin";

/* 龙岩医保 */
@Injectable()
export class ClientLongyanProxy {
    constructor(private httpClient: HttpClient) { }
    /*龙岩*/
    
    private readonly longyanremoteurl: string = 'http://127.0.0.1:50111/api/yibao.Longyan/longyanyibao/';

    //挂号读卡
    public longyanReadCard(): Observable<any> {
        let method = 'Mzghsk';
        return this.callRemoteService(this.longyanremoteurl, method);
    }

    //挂号
    public longyanregister(request: any): Observable<any> {
        let method: string = "Mzgh";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //预/收费读卡
    public longyanpresettlementreadcard(request: any): Observable<any> {
        let method: string = "Mzsfsk";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //预收费
    public longyanpresettlement(request: any): Observable<any> {
        let method: string = "Mzsfyjs";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //收费
    public longyansettlement(request: any, diagoseCode: string, diagnose: string): Observable<any> {
        let method: string = "Mzsf?diagoseCode=" + diagoseCode + "&diagnose=" + diagnose;
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //退费
    public longyanrefund(request: any): Observable<any> {
        let method: string = "Mzsfcx";
        return this.callRemoteService(this.longyanremoteurl, method, request);
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
