import { Component, OnInit, ViewChild, Injector, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ModalDirective } from 'ngx-bootstrap';
import { channelModel } from '@app/yibao/models/channelModel';
import { HttpClient } from '@angular/common/http';
import { AppConsts } from '@shared/AppConsts';
import { ChannelObjectServiceProxy, GetDefinitionInput, HisServiceProxy, QueryHisObjectInput, RegisteredChannelObjectInput } from '@shared/service-proxies/service-proxies';
import { JingdezhenYibaoService } from '@app/yibao/yibao.service';

@Component({
    selector: 'registerProviderModal',
    templateUrl: './register-provider-modal.component.html'
})
export class RegisterProviderComponent extends AppComponentBase implements AfterViewInit {
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
    hisObjectId: string;
    his: string;
    channel: string;



    @ViewChild('registerProviderModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        private yibaoservice: ChannelObjectServiceProxy,
        private jingdezhenyibaoservice:JingdezhenYibaoService,
        private hisservice: HisServiceProxy,
        private httpClient: HttpClient,
    ) {
        super(injector);
    }

    ngAfterViewInit() {
    }

    public getDefinition() {
        let request:GetDefinitionInput =  new GetDefinitionInput();
        request.channel = this.channel;
        request.objectType = 'Provider';

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

    save(): void {
        let request = new RegisteredChannelObjectInput();
        request.hisObjectId = this.hisObjectId;
        request.channel = this.channel;
        request.channelObjectId = this.channelObjectId;
        request.channelObjectName = this.channelObjectName;
        request.objectType='Provider';
        request.fields={};
        this.fields.forEach(element => {
            request.fields[element.fieldName] = element.value;
        });

        if (this.channel == 'Heilongjiang') {
            this.heilongjiangSave(request);
        }
        else if (this.channel == 'Jingdezhen') {
            this.jingdezhenSave(request);
        }
        //else if (this.channel == 'Longyan') {
        //    this.longyanSave(request);
        //}
        else {
            this.commonSave(request);
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();
        this.clear();
    }

    clear(): void {
        this.fields = [];
        this.channelObjectId = '';
        this.channelObjectName = '';
        $("#channelselect").val('');
        $("#hisselect").val('');
    }

    doselect(e): any {
        let data = e.params.data;
        if (data != null) {
            this.hisObjectId = data.id;
            if (this.channel == 'Jingdezhen') {
                this.fields.forEach(function (f) {
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
                            channel: 'Heilongjiang',
                            objectType: 'Provider',
                            source: 0,
                            keyword: (<any>setting).data.term,
                            maxResultCount: 10,
                            skipCount: (((<any>setting).data.page || 1) - 1) * 10
                        }
                        this.httpClient.post(`${AppConsts.remoteServiceBaseUrl}/api/services/app/ChannelObject/Query`, request).toPromise().then(success).catch(failure);
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
            })

            $("#channelselect").on('select2:select', (e: any) => {
                var data = e.params.data;
                if (data != null) {
                    if (this.channel == 'Jingdezhen') {
                        this.fields.forEach( (f)=> {
                            if(f.fieldName == 'hisObjectName' || f.fieldName == 'price'){
                                f.value = data.fields[f.fieldName];
                            }
                        });   
                    }
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
                            hisDataType: 1,
                            his: this.his,
                            keyword: (<any>setting).data.term,
                            maxResultCount: 10,
                            skipCount: (((<any>setting).data.page || 1) - 1) * 10
                        }
                        this.httpClient.post(`${AppConsts.remoteServiceBaseUrl}/api/services/app/His/QueryHisObject`, request).toPromise().then(success).catch(failure);
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
        let match = /^\d\d\d\d$/.exec(this.channelObjectId);
        if (match == null) {
            this.notify.error('人员编号必须为四位数字');
            return;
        }
        else {
            request.registerState = 1;
            this.yibaoservice.register(request).subscribe(res => {
                this.notify.info('保存成功');
                this.close();
                this.modalSave.emit(null);
            });
            return;
        }
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
                    p1: request.channelObjectId,
                    p2: request.channelObjectName,
                    p3: '1',
                    p5: request.fields.departmentCode
                });

                return this.jingdezhenyibaoservice.doctorUpload(registerParams).mergeMap(res => {
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

    //longyanSave(request: RegisteredChannelObjectInput): void {
        
    //        request.registerState = 1;
    //        this.yibaoservice.register(request).subscribe(res => {
    //            this.notify.info('保存成功');
    //            this.close();
    //            this.modalSave.emit(null);
    //        });
    //        return;
    //    }

    commonSave(request: RegisteredChannelObjectInput): any {
        request.registerState=1;
        this.yibaoservice.register(request)
        .subscribe(res => {
            this.notify.info('保存成功');
            this.close();
            this.modalSave.emit(null);
        });
    }
}
