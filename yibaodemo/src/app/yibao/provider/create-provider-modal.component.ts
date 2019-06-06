import { Component, OnInit, Injector, ViewChild, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap';
import { getDefinitionInput } from '@app/yibao/models/getDefinitionInput';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { channelObjectInput } from '@app/yibao/models/channelObjectInput';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { DatePipe } from '@angular/common';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, GetDefinitionInput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';



@Component({
    selector: 'createProviderModal',
    templateUrl: './create-provider-modal.component.html'
})
export class CreateProviderComponent extends AppComponentBase implements OnInit {

    fields: Array<any> = [];
    active: boolean = false;
    saving: boolean = false;
    text: string = "正在保存...";
    channelObjectId: string = "";
    channelObjectName: string = "";
    canEdit = false;
    tempfields = {};
    channel:string;

    @ViewChild('createProviderModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    constructor(public yibaoservice: ChannelObjectServiceProxy,
        injector: Injector) {
        super(injector);
    }

    ngOnInit(): void { }

    getDefinition(): void {
        let definitioninput: GetDefinitionInput = new GetDefinitionInput();
        definitioninput.channel = this.channel;
        definitioninput.objectType = 'Provider';
        this.yibaoservice.getDefinition(definitioninput).subscribe(result => {
            console.log(result);
            this.fields = result.fields;
            this.fields.forEach(field => {
                field.fieldTypeName = yibaoConsts.dataType[field.fieldType];
                if (this.canEdit) {
                    field.value = this.tempfields[field.fieldName];
                }
            });
        })
    }

    show(channel:string,providerid?: number): void {
        const self = this;
        self.channel = channel;
        self.active = true;
        if (providerid) {
            this.canEdit = true;
            this.yibaoservice.get(providerid).subscribe(res => {
                this.tempfields = res.fields;
                this.channelObjectId = res.channelObjectId;
                this.channelObjectName = res.channelObjectName;
                this.getDefinition();
            });
        }
        else{
            this.getDefinition();
        }
        self.modal.show();
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
        this.canEdit = false;
    }

    save(): void {
        let channelobjectinput: ChannelObjectInput = new ChannelObjectInput();
        //channelobjectinput.his = 'Saas',
        channelobjectinput.channel = this.channel;
        channelobjectinput.channelObjectId = this.channelObjectId;
        channelobjectinput.objectType = 'Provider';
        channelobjectinput.fields = {};
        channelobjectinput.channelObjectName = this.channelObjectName;

        this.fields.forEach(ele => {
            let filedName = ele.filedName;
            channelobjectinput.fields[ele.fieldName] = ele.value;
            //Object.assign(channelobjectinput.fields,{ele[]);
        });

        this.yibaoservice.create(channelobjectinput).subscribe(result => {
            //console.log(result);
            this.notify.info('保存成功');
            this.close();
            this.modalSave.emit(null);
        });
    }
}
