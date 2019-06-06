import { Component, OnInit, ViewChild, Injector, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ModalDirective } from 'ngx-bootstrap';
import { channelModel } from '@app/yibao/models/channelModel';
import { HttpClient } from '@angular/common/http';
import { registeredChannelObjectInput } from '@app/yibao/models/registeredChannelObjectInput';
import { AppConsts } from '@shared/AppConsts';
import { HeilongjiangYibaoService, JingdezhenYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, GetDefinitionInput, HisServiceProxy, QueryHisObjectInput, RegisteredChannelObjectInput } from '@shared/service-proxies/service-proxies';



@Component({
    selector: 'registerDepartmentModal',
    templateUrl: './register-department-modal.component.html'
})
export class RegisterDepartmentComponent extends AppComponentBase implements AfterViewInit {
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
    registerchannelobject: registeredChannelObjectInput;
    channel: string;



    @ViewChild('registerDepartmentModal') modal: ModalDirective;
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
        request.objectType = 'Department';
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
        let request: RegisteredChannelObjectInput = new RegisteredChannelObjectInput();
        request.hisObjectId = this.hisObjectId;
        request.channel = this.channel;
        request.channelObjectId = this.channelObjectId;
        request.channelObjectName = this.channelObjectName;
        request.objectType = 'Department';
        request.fields = {};
        request.hisObjectName = null;
        this.fields.forEach(element => {
            request.fields[element.fieldName] = element.value;
        });

        if (this.channel == 'Jingdezhen') {
            this.jingdezhenSave(request);
        }
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
        this.hisObjectId = '';
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
                            channel: 'Jingdezhen',
                            objectType: 'Department',
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
                            hisDataType: 4,
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

    jingdezhenSave(request: any): any {
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
                    p1: request.channelObjectId,                      //科室编号
                    p2: request.channelObjectName,                    //科室名称
                });

                return this.jingdezhenyibaoservice.departmentUpload(registerParams).mergeMap(res => {
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

    commonSave(request: any): any {
        request.registerState = 1;
        this.yibaoservice.register(request)
        .subscribe(res => {
            this.notify.info('保存成功');
            this.close();
            this.modalSave.emit(null);
        });
    }
}
