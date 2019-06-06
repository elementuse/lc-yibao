import { Component, OnInit, Injector } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import { AppSessionService } from "@shared/common/session/app-session.service";
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import * as moment from 'moment';
import { ProcessServiceProxy, GetProcessInput, ProcessDtoType } from "@shared/service-proxies/service-proxies";
import { ClientTaizhouProxy } from "process/taizhou/client-taizhou.proxy";
import { Observable } from "rxjs";

@Component({
    templateUrl: "./taizhou-check.component.html",
    styleUrls: ['./taizhou-check.component.css'],
    animations: [appModuleAnimation()]
})
export class TaizhouCheckComponent extends AppComponentBase
    implements OnInit {

    constructor(
        injector: Injector,
        private processService: ProcessServiceProxy,
        private taizhouProxy: ClientTaizhouProxy
    ) {
        super(injector);
    }

    ch = yibaoConsts.ch;
    constprocessType = yibaoConsts.processType;
    checkDate:any;
    settleData:SettleDto[] = [];
    isLoading:boolean;
    isCheck:boolean;
    isSearch:boolean;

    ngOnInit() {
        this.checkDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
    }

    dayCheck(): void {
        this.isLoading = true;
        this.isSearch = false;
        this.settleData = [];

        let input: GetProcessInput = new GetProcessInput();
        input.settleDate = moment(this.checkDate).format('YYYY-MM-DD');
        input.state = 4;
        this.processService
            .getProcess(input)
            .mergeMap(res => {
                let checkParams = {
                    hospitalCode: abp.setting.get("Taizhou.HospitalCode.Tenant"),
                    p1: "0",
                    p5: moment(this.checkDate).format('YYYYMMDD'),
                    p6: {
                        p1: 0,
                        p2: 0,
                        p3: 0,
                        p4: 0,
                        p5: 0,
                        p6: 0,
                        p7: 0,
                        p8: 0,
                        p9: 0,
                        p10: 0,
                        p11: 0,
                        p12: 0,
                        p13: 0,
                        p14: 0,
                        p15: 0,
                        p16: 0,
                        p17: 0,
                        p18: 0,
                        p19: 0,
                        p20: 0,
                        p21: 0,
                        p22: 0,
                        p23: 0
                    },
                    p7: {
                        p1: 0,
                        p2: 0,
                        p3: 0,
                        p4: 0,
                        p5: 0,
                        p6: 0,
                        p7: 0,
                        p8: 0,
                        p9: 0,
                        p10: 0,
                        p11: 0,
                        p12: 0,
                        p13: 0,
                        p14: 0,
                        p15: 0,
                        p16: 0,
                        p17: 0,
                        p18: 0,
                        p19: 0,
                        p20: 0,
                        p21: 0,
                        p22: 0,
                        p23: 0
                    }
                };
                let refthis = this;
                res.forEach(function(processDto) {
                    let dto = new SettleDto();
                    dto.id = processDto.id;
                    dto.hisOrderId = processDto.hisOrderId;
                    dto.patientName = processDto.patientName;
                    dto.settleDate = processDto.lastModificationTime.format('YYYYMMDD HHmmss');
                    dto.type = processDto.type;
                    let settleResult = processDto.type == 0 ? JSON.parse(processDto.extensionData)["DataStore.SettleResult"] : JSON.parse(processDto.extensionData)["DataStore.RefundResult"];
                    dto.settleNo = settleResult.settleNo;
                    dto.calculateResultInfo = settleResult.calculateResultInfo;
                    refthis.settleData.push(dto);

                    checkParams.p6.p1 += parseFloat(settleResult.calculateResultInfo.p1);
                    checkParams.p6.p2 += parseFloat(settleResult.calculateResultInfo.p2);
                    checkParams.p6.p3 += parseFloat(settleResult.calculateResultInfo.p3);
                    checkParams.p6.p4 += parseFloat(settleResult.calculateResultInfo.p4);
                    checkParams.p6.p5 += parseFloat(settleResult.calculateResultInfo.p5);
                    checkParams.p6.p6 += parseFloat(settleResult.calculateResultInfo.p6);
                    checkParams.p6.p7 += parseFloat(settleResult.calculateResultInfo.p7);
                    checkParams.p6.p8 += parseFloat(settleResult.calculateResultInfo.p8);
                    checkParams.p6.p9 += parseFloat(settleResult.calculateResultInfo.p9);
                    checkParams.p6.p10 += parseFloat(settleResult.calculateResultInfo.p10);
                    checkParams.p6.p11 += parseFloat(settleResult.calculateResultInfo.p11);
                    checkParams.p6.p12 += parseFloat(settleResult.calculateResultInfo.p12);
                    checkParams.p6.p13 += parseFloat(settleResult.calculateResultInfo.p13);
                    checkParams.p6.p14 += parseFloat(settleResult.calculateResultInfo.p14);
                    checkParams.p6.p15 += parseFloat(settleResult.calculateResultInfo.p15);
                    checkParams.p6.p16 += parseFloat(settleResult.calculateResultInfo.p16);
                    checkParams.p6.p17 += parseFloat(settleResult.calculateResultInfo.p17);
                    checkParams.p6.p18 += parseFloat(settleResult.calculateResultInfo.p18);
                    checkParams.p6.p19 += parseFloat(settleResult.calculateResultInfo.p28);
                    checkParams.p6.p20 += parseFloat(settleResult.calculateResultInfo.p29);
                    checkParams.p6.p21 += parseFloat(settleResult.calculateResultInfo.p21);
                    checkParams.p6.p22 += parseFloat(settleResult.calculateResultInfo.p22);
                    checkParams.p6.p23 += parseFloat(settleResult.calculateResultInfo.p25);
                });

                this.isCheck = true;
                return this.taizhouProxy.daycheck(checkParams);
            })
            .finally(() => {
                this.isLoading = false;
            })
            .subscribe(res => {
                if (res.p6 < 0) {
                    abp.message.info(res.p7, "对账不一致");
                }
                else {
                    abp.message.success("对账成功");
                }
            });
    }
    
    getList(): void {
        this.isLoading = true;
        this.primengTableHelper.showLoadingIndicator();
        this.downloadTran("0")
        .finally(() => {
            this.isLoading = false;
            this.primengTableHelper.hideLoadingIndicator();
        })
        .subscribe(res => {
            this.isSearch = true;
            this.primengTableHelper.records = this.settleData;
            this.primengTableHelper.totalRecordsCount = this.settleData.length;
        });
    }

    downloadTran(startNo:string): Observable<any> {
        let downloadParams = {
            hospitalCode: abp.setting.get("Taizhou.HospitalCode.Tenant"),
            p1: "0",
            p5: moment(this.checkDate).format('YYYYMMDD'),
            p6: "0",
            p7: startNo
        };
        return this.taizhouProxy
            .transdownload(downloadParams)
            .mergeMap(res => {
                let refthis = this;
                res.p8.forEach(function(item) {
                    let findrow = refthis.settleData.find(c => c.settleNo == item.p1);
                    if(findrow) {
                        findrow.yibaoInfo = item;
                    }
                    else {
                        findrow = new SettleDto();
                        findrow.settleNo = item.p1;
                        findrow.settleDate = item.p5;
                        findrow.yibaoInfo = item;
                        refthis.settleData.push(findrow);
                    }
                });

                if(res.p6 == "1") {
                    return this.downloadTran(res.p8[res.p7-1].p1);
                }
                else {
                    return Observable.of(res);
                }
            });
    }
}

class SettleDto {
    id: string | undefined;
    hisOrderId: string | undefined;
    patientName: string | undefined;
    type: ProcessDtoType | undefined;
    settleNo: string | undefined;
    settleDate: string | undefined;
    calculateResultInfo: any | undefined;
    yibaoInfo: any | undefined;
}
