import { Component, OnInit, ViewChild, Injector, AfterViewChecked, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ModalDirective } from 'ngx-bootstrap';
import { channelModel } from '@app/yibao/models/channelModel';
import { HttpClient } from '@angular/common/http';
import { registeredChannelObjectInput } from '@app/yibao/models/registeredChannelObjectInput';
import { DatePipe } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';
import { HeilongjiangYibaoService, JingdezhenYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, GetDefinitionInput, HisServiceProxy, QueryHisObjectInput, RegisteredChannelObjectInput } from '@shared/service-proxies/service-proxies';
import { Observable } from 'rxjs';
import { ChargeItemServiceFactory } from '@shared/chargeItem.factory';
import { IChannelObjectDto } from "@shared/service-proxies/service-proxies";



@Component({
    selector: 'registerItemModal',
    templateUrl: './register-item-modal.component.html'
})
export class RegisterItemComponent extends AppComponentBase implements AfterViewInit, AfterViewChecked, OnInit {
    useHisObjectDirectory: boolean = false;
    useChannelObjectDirectory: boolean = false;
    fields: Array<any> = [];
    hisDataType: any = null;
    active: boolean = false;
    channels: channelModel[];
    selectedChannel: channelModel;
    sourceId: string;
    channelObjectId: string;
    channelObjectName: string;
    public hisObjectId: string;
    his: string;
    registerchannelobject: registeredChannelObjectInput;
    channel: string;


    @ViewChild('registerItemModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        private yibaoservice: ChannelObjectServiceProxy,
        private heilongjiangyibaoservice:HeilongjiangYibaoService,
        private jingdezhenyibaoservice:JingdezhenYibaoService,
        private hisservice: HisServiceProxy,
        private servicefactory:ChargeItemServiceFactory,
        private httpClient: HttpClient,
        private datepipe: DatePipe
    ) {
        super(injector);
    }

    ngAfterViewInit() {

    }

    ngAfterViewChecked() {
        // console.log($("#hisselect"))

    }

    ngOnInit() {
        // console.log($("#hisselect"))
    }

    public getDefinition() {
        let request:GetDefinitionInput =  new GetDefinitionInput();
        request.channel = this.channel;
        request.objectType = 'ChargeItem';
        this.yibaoservice.getDefinition(request).mergeMap((res: any) => {
            this.hisDataType = res.hisDataType;
            this.useChannelObjectDirectory = res.registerFromDirectory;
            this.fields = res.fields;
            this.fields.forEach(element => {
                element.fieldTypeName = yibaoConsts.dataType[element.fieldType];
            });

            let request2:QueryHisObjectInput = new QueryHisObjectInput();
            request2.hisDataType = this.hisDataType;
            return this.hisservice.queryEnabled(request2);
        }).subscribe(res => {
            this.useHisObjectDirectory = res;
        })
    }

    show(channel: string) {
        const self = this;
        self.active = true;
        self.channel = channel;
        this.getDefinition();
        self.modal.show();
        this.InitSelect();
    }

    close(): void {
        this.active = false;
        this.clear();
        this.modal.hide();
    }

    clear(): void {
        this.fields = [];
        this.channelObjectId = '';
        this.channelObjectName = '';
        this.hisObjectId = '';
        $("#channelselect").val('');
        $("#hisselect").val('');
    }


    query() {
        let request = {
            channel: 'Heilongjiang',
            objectType: 'ChargeItem',
            source: 0,
            keyword: '',
            maxResultCount: 10
        };
        //this.yibaoservice.query()
    }

    save(): void {
        let request: RegisteredChannelObjectInput = new RegisteredChannelObjectInput();
        request.hisObjectId = this.hisObjectId;
        request.channel = this.channel;
        request.channelObjectId = this.channelObjectId;
        request.channelObjectName = this.channelObjectName,
        request.objectType = 'ChargeItem',
        request.fields = {},
        request.hisObjectName = null,
        // request.his = null
        this.fields.forEach(element => {
            request.fields[element.fieldName] = element.value;
        });

        if (this.channel == 'Heilongjiang') {
            this.heilongjiangSave(request);
        }
        else if (this.channel == 'Jingdezhen') {
            this.jingdezhenSave(request);
        }
        else {
            this.commonSave(request);
        }
    }


    doselect(e): any {
        let data = e.params.data;
        if (data != null) {
            this.hisObjectId = data.id;
            if (this.channel == 'Jingdezhen') {
                this.fields.forEach((f) =>{
                    if (f.fieldName == 'hisObjectName') {
                        f.value = data.name;
                    }
                    if (f.fieldName == 'price') {
                        f.value = data.price;
                    }
                });
            }
        }
    }

    InitSelect() {
        setTimeout(() => {
            $("#channelselect").select2({
                placeholder: '请选择',
                width: '750',
                ajax: {
                    delay: 250, // rate-limiting 250ms
                    transport: (setting, success, failure) => {
                        let request = {
                            channel: this.channel,
                            objectType: 'ChargeItem',
                            source: 0,
                            keyword: (<any>setting).data.term,
                            maxResultCount: 10,
                            skipCount: (((<any>setting).data.page || 1) - 1) * 10
                        }
                        this.httpClient.post(`${AppConsts.remoteServiceBaseUrl}/api/services/app/ChannelObject/Query`, request).toPromise().then(success).catch(failure => {
                            this.message.error("数据加载出错");
                        });
                    },
                    processResults: (data, params) => {
                        data.result.items.forEach(function (o) {
                            o.text = '[' + o.channelObjectId + '] ' + o.channelObjectName;
                        });
                        return {
                            results: data.result.items,
                            pagination: {
                                more: ((params.page || 1) * 10) < data.result.totalCount
                            }
                        };
                    }
                }
            })

            $("#channelselect").on('select2:select', (e: any) => {
                var data = e.params.data;
                if (data != null) {
                    this.fields.forEach(f => {
                        if (this.channel ==  'Jingdezhen' && (f.fieldName == 'hisObjectName' || f.fieldName == 'price'))
                           return;

                        f.value = data.fields[f.fieldName];
                    });
                    
                    this.sourceId = data.id;
                    this.channelObjectId = data.channelObjectId;
                    this.channelObjectName = data.channelObjectName;
                }
            });

            $("#hisselect").select2({
                placeholder: '请选择',
                width: '750',
                ajax: {
                    delay: 250,
                    transport: (setting, success, failure) => {
                        let request = {
                            hisDataType: 3,
                            his: this.his,
                            keyword: (<any>setting).data.term,
                            maxResultCount: 10,
                            skipCount: (((<any>setting).data.page || 1) - 1) * 10
                        }
                        this.httpClient.post(`${AppConsts.remoteServiceBaseUrl}/api/services/app/His/QueryHisObject`, request).toPromise().then(success).catch(failure => {
                            this.message.error("数据加载出错");
                        });
                    },
                    processResults: (data, params) => {
                        data.result.items.forEach(function (o) {
                            o.text = '[' + o.id + '] ' + o.name;
                        });
                        return {
                            results: data.result.items,
                            pagination: {
                                more: ((params.page || 1) * 10) < data.result.totalCount
                            }
                        };
                    }
                }
            });


            $("#hisselect").on('select2:select', (e) => {

                this.doselect(e);
            });

            
        }, 1000);
    }

    heilongjiangSave(request: RegisteredChannelObjectInput): void {
        request.registerState = 1;
        let request2 = {
            p1: request.fields.chargeItemType,
            p2: request.hisObjectId,
            p3: request.channelObjectName,
            p4: request.fields.pinyin,
            p5: request.fields.specification,
            p6: request.fields.drugTypeCode,
            p7: request.fields.standardPrice,
            p8: request.fields.unit,
            p9: request.fields.origin,
            p10: request.fields.categoryCode,
            p11: request.channelObjectId,
            p12: this.datepipe.transform(new Date(), 'yyyy-MM-dd hh:mm:00') //时间格式可能有问题
        }
        this.heilongjiangyibaoservice.addSXml(request2).mergeMap(res => {
            if (res.error="") {
                return Observable.create(observer => observer.next(res.error));
              }
              else{
                return this.yibaoservice.register(request);
              }
        }).subscribe((res:any) => {
            if (res!=null) {
                this.message.error(res,'保存失败')
              }
              else{
                this.notify.info('保存成功');
                this.close();
                this.modalSave.emit(null);
              }
        });
    }

    jingdezhenSave(request: RegisteredChannelObjectInput): any {
        let registerParams: any = {};
        registerParams.opratorCode = '0000';
        registerParams.Datas = [];

        this.jingdezhenyibaoservice.isDeleted(request).subscribe(res => {
            if (res.result) {
                return this.jingdezhenyibaoservice.unDeleted(request).subscribe(res => {
                    this.notify.info('保存成功');
                    this.close();
                    this.modalSave.emit(null);
                });
            }
            else {
                registerParams.Datas.push({
                    p1: request.fields.chargeItemType,                //收费项目种类
                    p2: request.channelObjectId,                      //三大目录中心编码
                    p3: request.hisObjectId,                          //医院项目内码
                    p4: request.fields.hisObjectName,                 //医院项目名称
                    p5: request.fields.drugType,                      //定点医疗机构药品剂型
                    p6: request.fields.drugSpec,                      //规格
                    p7: request.fields.price,                         //医院端价格
                    p11: this.datepipe.transform(new Date(), 'yyyyMMddHHmmss'),         //开始时间
                });

                return this.jingdezhenyibaoservice.categoryUpload(registerParams).mergeMap(res => {
                    request.registerState = 1;
                    return this.yibaoservice.register(request);
                }).subscribe(res => {
                    this.notify.info('保存成功');
                    this.close();
                    this.modalSave.emit(null);
                });
            }
        });
    }

    public async commonSave(request: RegisteredChannelObjectInput){
        try {
            // let dto:IChannelObjectDto = {
            //     id:0,
            //     objectType:request.objectType,
            //     channel:request.channel,
            //     channelObjectId:request.channelObjectId,
            //     channelObjectName:request.channelObjectName,
            //     registered:true,
            //     hisObjectId:request.hisObjectId,
            //     state:0,
            //     fields:request.fields
            // };
            // await this.servicefactory.GetService(this.channel).RegisterToYibao(dto);

            request.registerState = 1;
            await this.yibaoservice.register(request).toPromise();            
            this.notify.info('保存成功');
        } catch (error) {
            //abp.message.error(error,'错误');
        }finally{
            this.close();
            this.modalSave.emit(null);
        }

    }
}
