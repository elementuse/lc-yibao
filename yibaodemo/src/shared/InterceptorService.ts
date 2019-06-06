import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders,HttpErrorResponse } from "@angular/common/http";
import { Observable, Subject, observable, throwError } from 'rxjs';
import { finalize, tap, catchError, map, subscribeOn, mergeMap, merge } from 'rxjs/operators';

@Injectable()
export class InterceptorService implements HttpInterceptor {
    constructor() {

    }

    id: string = "";

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let secureReq: HttpRequest<any> = req;
        let modifiedHeaders = new HttpHeaders();
        modifiedHeaders = req.headers.set('Client', 'LinkedX');
        secureReq = req.clone({
            url: req.url,
            headers: modifiedHeaders
        });
        const started = Date.now();
        let ok: string;
        return next.handle(secureReq)
                .pipe( 
                    catchError((res: HttpErrorResponse) => {
                        return throwError(res.message);
                    }),
                    finalize(() => {
                        const elapsed = Date.now() - started;  //可计算出请求所消耗时间
                        const msg = `${req.method} "${req.urlWithParams}"in ${elapsed} ms.`;
                        console.log(msg);
                    }),
                    mergeMap(
                        // Succeeds when there is a response; ignore other events
                        (event: HttpResponse<any>) => {
                            // console.log(event.body);
                            if (event.body) {
                                if (event.body.isSuccess === false) {
                                    return throwError(event.body.resultMessage);
                                }else if(event.body.error){
                                    return throwError(event.body.error);
                                }
                            }
                            return Observable.create(observer => observer.next(event));
                            
                            // if (event.body.hasOwnProperty('isSuccess') && event.body.isSuccess === false) {
                            //     return Observable.throw(event.body.resultMessage);
                            // }else if(event.body.error){
                            //     return Observable.throw(event.body.error);
                            // }else{
                            //     return Observable.create(observer => observer.next(event));
                            // }
                }),

        );
    }
}