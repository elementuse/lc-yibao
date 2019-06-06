import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ObservableInput } from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import { AppConsts } from '@shared/AppConsts';
import { DatePipe } from '@angular/common';

@Injectable()
export class CommonProcessService {

    constructor(private httpClient: HttpClient, private datepipe: DatePipe) {
    }

    public getInternalStateWithData(processId: any): Observable<any> {
        let method = `/api/services/app/Process/GetInternalStateWithData?processId=${processId}`;
        return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method);
    }

    public callRemoteService(url: string, method: string, request: any = null): Observable<any> {
        return this.httpClient.post(url + method, request)
            .catch((response_: any) => {
                console.error(response_);
                abp.message.error("发生错误：服务请求异常");
                return <Observable<void>><any>Observable.throw(response_);
            });
    }
}

@Injectable()
export class HeilongjiangProcessService {

    private readonly remoteurl: string = 'http://127.0.0.1:50111/api/yibao.heilongjiang/heilongjiangyibao/';

    constructor(private httpClient: HttpClient, private datepipe: DatePipe) {
    }

    public doimportRegistered(request: any): Observable<any> {
        let method: string = "/api/services/app/ChannelObject/ImportRegistered";
        return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request);
    }

    public getImportInfo(request: any): Observable<any> {
        let method = '/api/services/app/ChannelObject/GetImportInfo';
        return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request).flatMap((result: any) => {
            return this.loadChargeItemDictAll(result);
        });
    }

    public getPublishNews(request: any): Observable<any> {
        return this.callRemoteService(this.remoteurl, 'getPublishNews', request);
    }

    public readPublishNews(request: any): Observable<any> {
        return this.callRemoteService(this.remoteurl, 'readPublishNews', request);
    }

    public readCardNormal(request: any): Observable<any> {
        return this.callRemoteService(this.remoteurl, `readCardNormal?pwd=${request}`);
    }

    public preSettle(seqNum: string, request: any) {
        return this.callRemoteService(this.remoteurl, `preSettlement?seqNum=${seqNum}`, request);
    }

    public preRefund(seqNum: string, request: any) {
        return this.callRemoteService(this.remoteurl, `preRefund?seqNum=${seqNum}`, request);
    }

    public refund(seqNum: string, request: any) {
        return this.callRemoteService(this.remoteurl, `refund?seqNum=${seqNum}`, request);
    }

    public charge(seqNum: string, request: any) {
        return this.callRemoteService(this.remoteurl, `charge?seqNum=${seqNum}`, request);
    }

    public queryAlertOrder(request: any) {
        return this.callRemoteService(this.remoteurl, 'QueryAlertOrder', request);
    }

    public queryReceipt(request: any) {
        return this.callRemoteService(this.remoteurl, 'receiptQuery', request);
    }
    public deleteAlertOrder(request: any) {
        return this.callRemoteService(this.remoteurl, 'DeleteAlertOrder', request);
    }

    public alertCharge(request: any, sequenceNum: string) {
        return this.callRemoteService(this.remoteurl, 'alertCharge', request)
    }

    public getAlertDetail(request: any) {
        return this.callRemoteService(this.remoteurl, 'GetAlertDetail', request);
    }

    public approveAlert(request: any) {
        return this.callRemoteService(this.remoteurl, 'ApproveAlert', request);
    }

    public alertPreSettle(request: any) {
        return this.callRemoteService(this.remoteurl, 'AlertPreSettle', request);
    }

    public queryChargeRecords(request: any) {
        return this.callRemoteService(this.remoteurl, 'queryChargeRecords', request);
    }

    public loadChargeItemDictAll(res: any): Observable<any> {
        let date: Date = new Date(res.result.lastUpdateTime);
        return Observable.forkJoin(
            this.loadChargeItem('KAC2', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
            this.loadChargeItem('KAC3', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
            this.loadChargeItem('KAC4', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
        ).mergeMap((result: any) => {
            console.log(result);
            let items_local = [];

            if (result[0] != null && result[0].page1 != null) {
                result[0].page1.forEach((o) => {
                    items_local.push({
                        hisObjectId: o.p1,
                        channel: 'Heilongjiang',
                        objectType: 'ChargeItem',
                        channelObjectName: o.p2,
                        channelObjectId: o.p9,
                        deleted: o.p17 == 0,
                        registerState: 1,
                        fields: {
                            standardPrice: o.p14,//标准价格
                            selfpayRatio: o.p16, //自付比例
                            chargeItemType: '1', // 药品
                            drugTypeCode: o.p6, //药品剂型编码
                            hisName: o.p10,
                            categoryCode: o.p11
                        }
                    })
                });
            }

            if (result[1] != null && result[1].page1 != null) {
                result[1].page1.forEach((o) => {
                    items_local.push({
                        hisObjectId: o.p1,
                        channel: 'Heilongjiang',
                        objectType: 'ChargeItem',
                        channelObjectName: o.p2,
                        channelObjectId: o.p9,
                        deleted: o.p17 == 0,
                        registerState: 1,
                        fields: {
                            standardPrice: o.p14,//标准价格
                            selfpayRatio: o.p16, //自付比例
                            chargeItemType: '2', // 药品
                            drugTypeCode: o.p6, //药品剂型编码
                            hisName: o.p10,
                            categoryCode: o.p11
                        }
                    });
                });
            }

            if (result[2] != null && result[2].page1 != null) {
                result[2].page1.forEach((o) => {
                    items_local.push({
                        hisObjectId: o.p1,
                        channel: 'Heilongjiang',
                        objectType: 'ChargeItem',
                        channelObjectName: o.p2,
                        channelObjectId: o.p9,
                        deleted: o.p17 == 0,
                        registerState: 1,
                        fields: {
                            standardPrice: o.p14,//标准价格
                            selfpayRatio: o.p16, //自付比例
                            chargeItemType: '3', // 药品
                            drugTypeCode: o.p6, //药品剂型编码
                            hisName: o.p10,
                            categoryCode: o.p11
                        }
                    });
                });
            }


            let req = {
                channel: 'Heilongjiang',
                objectType: "ChargeItem",
                fieldsWriteMode: 0, // override
                channelObjects: items_local
            }
            return this.doimportRegistered(req);

        });
    }

    public loadChargeItem(dictName: string, date: string): Observable<any> {
        if (date == null) {
            date = '1990-01-01 00:00:00';
        };


        return this.getPartSXML({
            p1: date,
            p2: '3',
            p3: dictName,
            p4: 'V1.0'
        });
    }

    public getPartSXML(request: any): Observable<any> {
        return this.callRemoteService(this.remoteurl, 'getPartSXML', request);
    }


    public callRemoteService(url: string, method: string, request: any = null): Observable<any> {
        return this.httpClient.post(url + method, request)
            .catch((response_: any) => {
                console.error(response_);
                abp.message.error(response_, "发生错误");
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

@Injectable()
export class JingdezhenProcessService {

    /*景德镇*/

    constructor(private httpClient: HttpClient, private datepipe: DatePipe) {
    }


    private readonly jingdezhenremoteurl: string = 'http://127.0.0.1:50111/api/yibao.JiangxiJingdezhen/yibao/';

    public setSetting(request: any): Observable<any> {
        let method: string = `/api/services/app/Setting/SetSetting?key=${request.key}&&value=${request.value}`;
        return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method);
    }
    public signIn(request: any) {
        let method: string = "SignIn";
        return this.callLocal(method, request);
    }
    public signOut(request: any) {
        let method: string = "SignOut";
        return this.callLocal(method, request);
    }

    public readCard(request: any) {
        let method: string = "ReadCard";
        return this.callLocal(method, request);
    }

    public checkLock(request: any) {
        let method: string = "CheckLock";
        return this.callLocal(method, request);
    }

    public register(request: any) {
        let method: string = "Register";
        return this.callLocal(method, request);
    }

    public prescriptionCheck(request: any) {
        let method: string = "PrescriptionCheck";
        return this.callLocal(method, request);
    }

    public prescriptionupload(request: any) {
        let method: string = "PrescriptionUpload";
        return this.callLocal(method, request);
    }

    public prescriptioncancel(request: any) {
        let method: string = "PrescriptionCancel";
        return this.callLocal(method, request);
    }

    public presettlement(request: any) {
        let method: string = "PreSettlement";
        return this.callLocal(method, request);
    }

    public settlement(request: any) {
        let method: string = "Settlement";
        return this.callLocal(method, request);
    }

    public settlementquery(request: any) {
        let method: string = "SettlementQuery";
        return this.callLocal(method, request);
    }

    public refund(request: any) {
        let method: string = "Refund";
        return this.callLocal(method, request);
    }

    public callLocal(method, request: any = null): Observable<any> {
        let suffix = 'Tenant';
        let hospitalCodeKey = `Jingdezhen.HospitalCode.${suffix}`;
        let businessCycleCodeKey = `Jingdezhen.BusinessCycle.${suffix}`;

        request.hospitalCode = abp.setting.get(hospitalCodeKey);
        if (request.businessCycleCode == null || request.businessCycleCode.length == 0) {
            request.businessCycleCode = abp.setting.get(businessCycleCodeKey);
        }

        if (method != 'SignIn' && (request.businessCycleCode == null || request.businessCycleCode == '' || request.businessCycleCode == '*')) {
            return this.callLocal('SignIn', request).flatMap(res => {
                request.businessCycleCode = res.p1;
                abp.setting.values[businessCycleCodeKey] = request.businessCycleCode;

                let request1 = {
                    key: businessCycleCodeKey,
                    value: request.businessCycleCode
                }
                return this.setSetting(request1);
            }).mergeMap(res => {
                return this.callApi(method, request)
            });
        }
        else {
            return this.callApi(method, request);
        }
    }

    public callApi(method: string, request: any): Observable<any> {
        if (request.hospitalCode == null || request.hospitalCode.length == 0) {
            abp.message.error('医疗机构编码不能为空');
            return Observable.throwError('医疗机构编码不能为空');
        }
        if (request.opratorCode == null || request.opratorCode.length == 0) {
            abp.message.error('操作员编码不能为空');
            return Observable.throwError('操作员编码不能为空');
        }
        if (null == request.sequenceNumber || "undefined" == typeof (request.sequenceNumber) || "" == request.sequenceNumber) {
            request.sequenceNumber = Math.ceil(Math.random() * 9999);
        }

        request.transactionCode = this.datepipe.transform(new Date(), "yyyyMMddHHmmss") + '-' + request.hospitalCode + '-' + this.PadLeft(request.sequenceNumber, 4);

        let url = this.jingdezhenremoteurl + method;
        if (request.processId) {
            url += '?seqNum=' + request.processId + request.sequenceNumber;
        }

        return this.httpClient.post(url, request).flatMap((result: any) => {
            if(method == "SettlementQuery"){
                return Observable.of(result);
            }
            
            if (!result.isSuccess) {
                // 业务周期号未签退处理
                let pattern = /操作员在本机未签退的业务周期号为：(\d+-\d+)，/i;
                let pattern1 = /操作员.+没有在本机上进行签到操作，/i;
                if (pattern.test(result.resultMessage)) {
                    request.businessCycleCode = result.resultMessage.match(pattern)[1];
                    return this.callLocal('SignOut', request).mergeMap(() => {
                        abp.message.warn('操作员在本机有未签退的业务，请重试！');
                        let suffix = "Tenant";
                        let businessCycleCodeKey = "Jingdezhen.BusinessCycle." + suffix;
                        request.businessCycleCode = '*';
                        abp.setting.values[businessCycleCodeKey] = request.businessCycleCode;

                        let request1 = {
                            businessCycleCodeKey: businessCycleCodeKey,
                            businessCycleCode: request.businessCycleCode
                        }
                        return this.setSetting(request1);
                    });
                }
                else if (pattern1.test(result.resultMessage)) {
                    abp.message.warn('操作员在本机未签到，请重试！');
                    let suffix = "Tenant";
                    let businessCycleCodeKey = "Jingdezhen.BusinessCycle." + suffix;
                    request.businessCycleCode = '*';
                    abp.setting.values[businessCycleCodeKey] = request.businessCycleCode;

                    let request1 = {
                        businessCycleCodeKey: businessCycleCodeKey,
                        businessCycleCode: request.businessCycleCode
                    }
                    return this.setSetting(request1);
                }
                else {
                    return Observable.throwError('医保返回错误：' + result.resultMessage)
                }
            }
            else {
                return Observable.of(result);
            }
        })
            .catch((response_: any) => {
                if (typeof (response_) == 'string') {
                    abp.message.error(response_);
                }
                else {
                    abp.message.error("医保发生错误：服务请求异常");
                }
                return <Observable<void>><any>Observable.throw(response_);
            });

    }

    public PadLeft(num, n) {
        return (Array(n).join('0') + num).slice(-n);
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

/* 深圳医保 */
@Injectable()
export class ShenzhenYibaoService {
    constructor(private httpClient: HttpClient) { }

    //Shenzhen Service Start
    private readonly shenzhenremoteurl: string =
        "http://127.0.0.1:50111/api/yibao.shenzhen/szyibao/";

    public xx001(request: any): Observable<any> {
        return this.callLocal("xx001", request);
    }

    public mz002(request: any): Observable<any> {
        return this.callLocal("mz002", request);
    }

    public fy001(request: any): Observable<any> {
        return this.callLocal("fy001", request);
    }

    public fy002(request: any): Observable<any> {
        return this.callLocal("fy002", request);
    }

    public fy003(request: any): Observable<any> {
        return this.callLocal("fy003", request);
    }

    public fy004(request: any): Observable<any> {
        return this.callLocal("fy004", request);
    }

    public fy005(request: any): Observable<any> {
        return this.callLocal("fy005", request);
    }

    public jy002(request: any): Observable<any> {
        return this.callLocal("jy002", request);
    }

    public ml004(request: any): Observable<any> {
        return this.callLocal("ml004", request);
    }

    public callLocal(method, request: any = null): Observable<any> {
        if (request.hospitalCode == null || request.hospitalCode.length == 0) {
            abp.message.error("医疗机构编码不能为空");
            return Observable.throwError("医疗机构编码不能为空");
        }
        if (request.operatorCode == null || request.operatorCode.length == 0) {
            abp.message.error("操作员编码不能为空");
            return Observable.throwError("操作员编码不能为空");
        }
        if (request.operatorName == null || request.operatorName.length == 0) {
            abp.message.error("操作员姓名不能为空");
            return Observable.throwError("操作员姓名不能为空");
        }
        request.operatorPass = "";

        let url = this.shenzhenremoteurl + method;
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
                if(typeof(response_) == 'string') {
                    if (method == 'mz002' && response_.indexOf(`门诊流水号[${request.akc190}]已存在`) > -1) {
                        return Observable.of(null);
                    }
                    else {
                        abp.message.error(response_);
                    }
                }
                else {
                    abp.message.error("医保发生错误：服务请求异常");
                }
                return <Observable<void>><any>Observable.throw(response_);
            });
        // return this.httpClient
        //     .post(url, request)
        //     .catch((response_: any) => {
        //         abp.message.error(response_, "医保发生错误：服务请求异常");
        //         return <Observable<void>><any>Observable.throw(response_);
        //     });
    }
}

/* 深圳智慧医保 */
@Injectable()
export class ShenzhenWisdomService {
    constructor(private httpClient: HttpClient) { }

    //Shenzhen Service Start
    private readonly shenzhenremoteurl: string =
        "http://127.0.0.1:50111/api/yibao.shenzhen/szwisdom/";

    public remind(request: any): Observable<any> {
        return this.callLocal("remind", request);
    }

    public audit(request: any): Observable<any> {
        return this.callLocal("audit", request);
    }

    public callLocal(method, request: any = null): Observable<any> {
        if (request.operate_person_code == null || request.operate_person_code.length == 0) {
            abp.message.error("操作员编码不能为空");
            return Observable.throwError("操作员编码不能为空");
        }

        let url = this.shenzhenremoteurl + method;
        if (request.processId) {
            url += "?seqNum=" + request.processId + request.sequenceNumber;
        }

        return this.httpClient
            .post(url, request)
            .flatMap((result: any) => {
                if (result.success != 'T') {
                    return Observable.throwError(
                        "智慧医保返回错误：" + result.error_msg
                    );
                } else {
                    return Observable.of(result);
                }
            })
            .catch((response_: any) => {
                if (typeof (response_) == 'string') {
                    abp.message.error(response_);
                }
                else {
                    abp.message.error("智慧医保发生错误：服务请求异常");
                }
                return <Observable<void>><any>Observable.throw(response_);
            });
    }
}


/* 青岛医保 */
@Injectable()
export class QingdaoProcessService {

    constructor(private httpClient: HttpClient, private datepipe: DatePipe) {
    }


    private readonly qingdaoremoteurl: string = 'http://localhost:50111/api/yibao.qingdao/yibao/';

    public encrypt(request: any) {
        let method: string = "encrypt";
        return this.callLocal(method, request);
    }


    public callLocal(method, request: any = null): Observable<any> {
        let url = this.qingdaoremoteurl + method;
        if (request.processId) {
            url += "?seqNum=" + request.processId + request.sequenceNumber;
        }

        return this.httpClient
            .post(url, request)
            .flatMap((result: any) => {
                if (!result.isSuccess) {
                    return Observable.throwError(
                        "医保返回错误：" + result.resultMessage
                    );
                } else {
                    return Observable.of(result);
                }
            })
            .catch((response_: any) => {
                if (typeof (response_) == 'string') {
                    abp.message.error(response_);
                }
                else {
                    abp.message.error("医保发生错误：服务请求异常");
                }
                return <Observable<void>><any>Observable.throw(response_);
            });
    }
}



