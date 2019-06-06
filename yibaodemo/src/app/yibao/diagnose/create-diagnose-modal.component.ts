import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { ChannelObjectServiceProxy, GetDefinitionInput, ChannelObjectInput } from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'createDiagnoseModal',
    templateUrl: './create-diagnose-modal.component.html'
})
export class CreateDiagnoseComponent extends AppComponentBase implements OnInit {

    fields: Array<any> = [];
    active: boolean = false;
    saving: boolean = false;
    text: string = "正在保存...";
    channelObjectId: string = "";
    channelObjectName: string = "";
    canEdit = false;
    tempfields = {};
    channel:string;

    @ViewChild('createDiagnoseModal') modal: ModalDirective;

    constructor(
        public channelobjectservice: ChannelObjectServiceProxy, 
        injector: Injector,
    ) {
        super(injector);
    }

    ngOnInit(): void {  }
    getDefinition(): void {
        let definitioninput: GetDefinitionInput = new GetDefinitionInput();
        definitioninput.channel = this.channel;
        definitioninput.objectType = 'Diagnose';
        this.channelobjectservice.getDefinition(definitioninput).subscribe(result => {
            console.log(result);
            this.fields = result.fields;
            this.fields.forEach(field => {
                field.fieldTypeName = yibaoConsts.dataType[field.fieldType];
                if(this.canEdit){
                    field.value = this.tempfields[field.fieldName];
                }
            });
        })
    }

    show(channel: string, itemid?: number): void {
        const self = this;
        self.active = true;
        self.channel  = channel;
        if (itemid) {
            this.canEdit = true;
            this.channelobjectservice.get(itemid).subscribe(res => {
                this.tempfields = res.fields;
                this.channelObjectId = res.channelObjectId;
                this.channelObjectName = res.channelObjectName;
            });
        }
        this.getDefinition();
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

    save(): void{
        let channelobjectinput: ChannelObjectInput = new ChannelObjectInput();
        //channelobjectinput.his = 'Saas',
        channelobjectinput.channel = this.channel;
        channelobjectinput.channelObjectId = this.channelObjectId;
        channelobjectinput.objectType = 'Diagnose';
        channelobjectinput.fields = {};
        channelobjectinput.channelObjectName = this.channelObjectName;

        this.fields.forEach(ele => {
            let filedName  = ele.filedName;
            channelobjectinput.fields[ele.fieldName] = ele.value;
            //Object.assign(channelobjectinput.fields,{ele[]);
        });

        this.channelobjectservice.create(channelobjectinput).subscribe(result =>{
            //console.log(result);
            this.notify.info('保存成功');
            this.close();
        });
    }
}
