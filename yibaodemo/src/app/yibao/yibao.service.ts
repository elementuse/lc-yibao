import { Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, observable } from 'rxjs';
import 'rxjs/add/observable/forkJoin';
import { AppConsts } from '@shared/AppConsts';
import { DatePipe } from '@angular/common';
import { AppSessionService } from '@shared/common/session/app-session.service';

/*黑龙江医保*/
@Injectable()
export class HeilongjiangYibaoService {

  //Heilongjiang Service Start
  private readonly heilongjiangremoteurl: string = 'http://127.0.0.1:50111/api/yibao.heilongjiang/heilongjiangyibao/';

  public channel = "Heilongjiang";

  constructor(
    private httpClient: HttpClient,
    private datepipe: DatePipe,
    private appSessionService: AppSessionService
  ) {
    
  }

  /**
 * 查询当月申报费用
 */
  public queryMonthlyReport(request: any): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'QueryMonthlyReport', request);
  }

  //查询去年补报费用
  public queryMonthlyBubao(request): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'QueryMonthlyBubao', request);
  }

  //申报当月费用
  public declareMonthlyReport(request: any): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'DeclareMonthlyReport', request);
  }

  //查询定点机构参数配置信息
  public getClinicConfigragtion(): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'GetClinicConfiguration');
  }

  //查询经办机构参数配置信息
  public getAgencyConfiguration(): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'GetAgencyConfiguration');
  }

  //导入收费项
  public importInfo(request): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/GetImportInfo";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request).mergeMap((result: any) => {
      return this.loadChargeItemDictAll(result);
    });
  }

  public doimport(request: any): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/Import";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request);
  }

  public doimportRegistered(request: any): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/ImportRegistered";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request);
  }
  
  public importRegistered(request): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/GetImportInfo";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request).mergeMap((result: any) => {
      return this.loadChargeItemDictAllR(result);
    });
  }

  public getPartSXML(request: any): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'getPartSXML', request);
  }

  public loadChargeItemDictAll(res: any): Observable<any> {
    let date: Date = new Date(res.result.lastUpdateTime);
    return Observable.forkJoin([
      this.loadChargeItem('KA02', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
      this.loadChargeItem('KAF6', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
      this.loadChargeItem('KA03', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
      this.loadChargeItem('KA04', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00'))]
    ).mergeMap(result=> {
      let items_local = [];

      if (result[0] != null && result[0].page1 != null) {
        // result[0] = {};
        // Object.assign(result[0], { page1: [] })
        result[0].page1.forEach((o: any) => {
          items_local.push({
            channelObjectId: o.p1,
            channel: this.channel,
            channelObjectName: o.p2,
            deleted: o.p2 == null || o.p2 == '',
            registerState: 0,
            fields: {
              standardPrice: o.p6,//标准价格
              selfpayRatio: o.p7, //自付比例
              chargeItemType: '1', // 药品
              drugTypeCode: o.p8, //药品剂型编码
              categoryCode: o.p3
            }
          });
        });
      }

      if (result[1] != null && result[1].page1 != null) {
        // result[1] = {};
        // Object.assign(result[1], { page1: [] })
        result[1].page1.forEach((o: any) =>{
          let exist = items_local.find((ele)=> {
            return ele.channelObjectId == o.p1;
          });
          if (exist != null) {
            exist.fields.origin = o.p6;
            exist.fields.specification = o.p11;
          } else {
            items_local.push({
              channelObjectId: o.p1,
              channel: this.channel,
              deleted: 0,
              registerState: 0,
              fields: {
                origin: o.p6,
                specification: o.p11
              }
            });
          }
        });
      }

      if (result[2] != null && result[2].page1 != null) {
        result[2].page1.forEach((o: any) =>{
          items_local.push({
            channelObjectId: o.p1,
            channel: this.channel,
            channelObjectName: o.p2,
            deleted: o.p2 == null || o.p2 == '',
            registerState: 0,
            fields: {
              standardPrice: o.p6,//标准价格
              selfpayRatio: o.p7, //自付比例
              chargeItemType: '2',// 诊疗
              categoryCode: o.p3
            }
          });
        });
      }

      if (result[3] != null && result[3].page1 != null) {
        result[3].page1.forEach((o: any) =>{
          items_local.push({
            channelObjectId: o.p1,
            channel: this.channel,
            channelObjectName: o.p2,
            deleted: o.p2 == null || o.p2 == '',
            registerState: 0,
            fields: {
              standardPrice: o.p6,//标准价格
              selfpayRatio: o.p7, //自付比例
              chargeItemType: '3',// 设施
              categoryCode: o.p3
            }
          });
        });
      }


      let req = {
        channel: this.channel,
        objectType: "ChargeItem",
        fieldsWriteMode: 0, // override
        channelObjects: items_local
      }
      return this.doimport(req);
    });
  }

  public loadChargeItemDictAllR(res: any): Observable<any> {
    let date: Date = new Date(res.result.lastUpdateTime);
    return Observable.forkJoin(
      this.loadChargeItem('KAC2', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
      this.loadChargeItem('KAC3', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
      this.loadChargeItem('KAC4', this.datepipe.transform(date, 'yyyy-MM-dd HH:mm:00')),
    ).flatMap((result: any) => {
      console.log(result);
      let items_local = [];

      if (result[0] != null && result[0].page1 != null) {
        result[0].page1.forEach((o) => {
          items_local.push({
            hisObjectId: o.p1,
            channel: this.channel,
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
            channel: this.channel,
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
            channel: this.channel,
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
        channel: this.channel,
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
    // .flatMap(result => {
    //   console.log(result);
    //   if (result!= null && result.page1 != null) {
    //     return result.page1;
    //   } else {
    //     return [];
    //   }
    // });
  }

  public deleteSXml(request: any): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'DeleteSXML', request);
  }

  public addSXml(request: any): Observable<any> {
    return this.callRemoteService(this.heilongjiangremoteurl, 'AddSXml', request);
  }

  public callRemoteService(url: string, method: string, request: any = null): Observable<any> {
    return this.httpClient.post(url + method, request)
      .catch((response_: any) => {
        console.error(response_);
        abp.message.error('医保客户端返回错误',"发生错误");
        return <Observable<void>><any>Observable.throw(response_);
      })
      .mergeMap((res:any)=>{
        if (res) {
          if (res.error) {
            abp.message.error(''+res.error,"发生错误");
          } 
        }
          return Observable.of(res);
      });
  }

  public callRemoteServiceget(url: string, method: string, request: any = null): Observable<any> {
    let options = { params: request }
    return this.httpClient.get(url + method, options)
      .catch((response_: any) => {
        console.error(response_);
        abp.message.error(response_,"发生错误");
        return <Observable<void>><any>Observable.throw(response_);
      });
  }

}



/*景德镇医保*/
@Injectable()
export class JingdezhenYibaoService {

  public channel = "Jingdezhen";

  constructor(
    private httpClient: HttpClient,
    private datepipe: DatePipe,
    private appSessionService: AppSessionService
  ) {
  }

  //Jingdezhen Service Start
  private readonly jingdezhenremoteurl: string = 'http://127.0.0.1:50111/api/yibao.JiangxiJingdezhen/yibao/';

  public setSetting(request: any): Observable<any> {
    let method: string = `/api/services/app/Setting/SetSetting?key=${request.key}&&value=${request.value}`;
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method);
  }

  public signIn(request: any): Observable<any> {
      let method: string = "SignIn";
      return this.callLocal(method, request);
  }
  public signOut(request: any): Observable<any> {
      let method: string = "SignOut";
      return this.callLocal(method, request);
  }

  public drugDownload(request: any): Observable<any> {
    let method: string = "DrugDownload";
    return this.callLocal(method, request);
  }

  public diagnosisDownload(request: any): Observable<any> {
    let method: string = "DiagnosisDownload";
    return this.callLocal(method, request);
  }

  public serviceDownload(request: any): Observable<any> {
    let method: string = "ServiceDownload";
    return this.callLocal(method, request);
  }

  public isDeleted(request: any): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/isDeleted";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request);
  }

  public unDeleted(request: any): Observable<any> {
    let method: string = "/api/services/app/ChannelObject/unDeleted";
    return this.callRemoteService(AppConsts.remoteServiceBaseUrl, method, request)
  }

  public doctorUpload(request: any): Observable<any> {
    let method: string = 'DoctorUpload';
    return this.callLocal(method, request);
  }

  public categoryUpload(request: any): Observable<any> {
    let method: string = 'CategoryUpload';
    return this.callLocal(method, request);
  }

  public departmentUpload(request: any): Observable<any> {
    let method: string = 'DepartmentUpload';
    return this.callLocal(method, request);
  }

  public callLocal(method, request: any = null): Observable<any> {
    let suffix = this.appSessionService.tenant ? 'Tenant' : 'Application';
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
      if (!result.isSuccess) {
        // 业务周期号未签退处理
        let pattern = /操作员在本机未签退的业务周期号为：(\d+-\d+)，/i;
        let pattern1 = /操作员.+没有在本机上进行签到操作，/i;
        if (pattern.test(result.resultMessage)) {
          request.businessCycleCode = result.resultMessage.match(pattern)[1];
          return this.callLocal('SignOut', request).mergeMap(() => {
            abp.message.warn('操作员在本机有未签退的业务，请重试！');
            let suffix = this.appSessionService.tenant ? "Tenant" : "Application";
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
          let suffix = this.appSessionService.tenant ? "Tenant" : "Application";
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
        if(typeof(response_) == 'string') {
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
  constructor(private httpClient: HttpClient) {}

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
                  abp.message.error(
                      "医保返回错误：" + result.resultMessage,
                      "调用失败"
                  );
                  return Observable.throwError(
                      "医保返回错误：" + result.resultMessage
                  );
              } else {
                  return Observable.of(result);
              }
          })
          .catch((response_: any) => {
            console.error(response_);
            abp.message.error("医保发生错误：服务请求异常");
            return <Observable<void>><any>Observable.throw(response_);
          });
  }
}



/* 龙岩医保 */
@Injectable()
export class LongyanYibaoService {
    constructor(private httpClient: HttpClient) { }

    //Longyan Service Start
    private readonly longyanremoteurl: string =
        "http://127.0.0.1:50111/api/yibao.Longyan/yibao/";


    //挂号读卡
    public longyanReadCard() {
        let method = 'Mzghsk';
        return this.callRemoteService(this.longyanremoteurl, method);
    }

    //挂号
    public longyanregister(request: any) {
        let method: string = "Mzgh";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //预/收费读卡
    public longyanpresettlementreadcard(request: any) {
        let method: string = "Mzsfsk";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //预收费
    public longyanpresettlement(request: any) {
        let method: string = "Mzsfyjs";
        return this.callRemoteService(this.longyanremoteurl, method, request);
    }

    //收费
    public longyansettlement(request: any) {
        let method: string = "Mzsf";
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





