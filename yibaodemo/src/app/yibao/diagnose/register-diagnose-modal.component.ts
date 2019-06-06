import { Component, OnInit, ViewChild, Injector, AfterViewChecked, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ModalDirective } from 'ngx-bootstrap';
import { channelModel } from '@app/yibao/models/channelModel';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';
import { ChannelObjectServiceProxy, GetDefinitionInput, RegisteredChannelObjectInput } from '@shared/service-proxies/service-proxies';



@Component({
    selector: 'registerDiagnoseModal',
    templateUrl: './register-diagnose-modal.component.html'
})
export class RegisterDiagnoseComponent extends AppComponentBase implements AfterViewInit, AfterViewChecked, OnInit {
    useChannelObjectDirectory: boolean = false;
    fields: Array<any> = [];
    active: boolean = false;
    channels: channelModel[];
    selectedChannel: channelModel;
    sourceId: string;
    channelObjectId: string;
    channelObjectName: string;
    his: string;
    channel: string;


    @ViewChild('registerDiagnoseModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        private channelobjectservice: ChannelObjectServiceProxy,
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
        request.objectType = 'Diagnose';
        this.channelobjectservice.getDefinition(request).subscribe((result: any) => {
            this.useChannelObjectDirectory = result.registerFromDirectory;
            this.fields = result.fields;
            console.log(this.fields);
            this.fields.forEach(element => {
                element.fieldTypeName = yibaoConsts.dataType[element.fieldType];
            });
        });
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
        $("#channelselect").val('');
    }

    save(): void {
        let request = new RegisteredChannelObjectInput();
        request.hisObjectId=this.channelObjectId;
        request.channel=this.channel;
        request.channelObjectId=this.channelObjectId;
        request.channelObjectName=this.channelObjectName;
        request.objectType='Diagnose';
        request.fields={};
        request.registerState=1;
        this.fields.forEach(element => {
            request.fields[element.fieldName] = element.value;
        });
        this.channelobjectservice.register(request)
        .subscribe(res => {
            this.notify.info('保存成功');
            this.close();
            this.modalSave.emit(null);
        });
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
                            objectType: 'Diagnose',
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
                    if (this.channel == 'Jingdezhen') {
                        this.fields.forEach((f) => {
                            if (f.fieldName == 'hisObjectName' || f.fieldName == 'price') {
                                f.value = data.fields[f.fieldName];
                            }
                        });
                    }
                    if (this.channel == 'Longyan') {
                        this.fields.forEach((f) => {
                            f.value = data.fields[f.fieldName];
                        });
                    }

                    if (this.channel == 'Fujianfuzhou') {
                        this.fields.forEach((f) => {
                            f.value = data.fields[f.fieldName];
                        });
                    }

                    this.sourceId = data.id;
                    this.channelObjectId = data.channelObjectId;
                    this.channelObjectName = data.channelObjectName;
                }
            });
        }, 1000);
    }
}
