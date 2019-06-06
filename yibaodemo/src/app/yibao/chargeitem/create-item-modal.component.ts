import { Component, OnInit, Injector, ViewChild,Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ModalDirective } from 'ngx-bootstrap';
import { getDefinitionInput } from '@app/yibao/models/getDefinitionInput';
import { yibaoConsts } from '@app/yibao/yibaoConsts';
import { channelObjectInput } from '@app/yibao/models/channelObjectInput';
import { HeilongjiangYibaoService } from '@app/yibao/yibao.service';
import { ChannelObjectServiceProxy, GetDefinitionInput, ChannelObjectInput, UpdateChannelObjectInput,QueryHisObjectInput, HisServiceProxy } from '@shared/service-proxies/service-proxies';



@Component({
    selector: 'createItemModal',
    templateUrl: './create-item-modal.component.html'
})
export class CreateItemComponent extends AppComponentBase implements OnInit {
    
    useHisObjectDirectory: boolean = false;
    useChannelObjectDirectory: boolean = false;
    hisDataType: any = null;
    fields: Array<any> = [];
    active: boolean = false;
    saving: boolean = false;
    text: string = "正在保存...";
    channelObjectId: string = "";
    channelObjectName: string = "";
    canEdit = false;
    //tempfields: { [key: string] : string; };
    tempfields = {};
    channel:string;
    hisObjectId:string;
    hisObjectName:string;
    itemid:number;

    @ViewChild('createItemModal') modal: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();


    constructor(
        public yibaoservice: ChannelObjectServiceProxy, 
        injector: Injector,
        private hisservice: HisServiceProxy,
        private heilongjiangyibaoservice:HeilongjiangYibaoService
    ) {
        super(injector);
    }

    ngOnInit(): void {  }

    getDefinition(): void {
        let definitioninput: GetDefinitionInput = new GetDefinitionInput();
        definitioninput.channel = this.channel;
        definitioninput.objectType = 'ChargeItem';
        this.yibaoservice.getDefinition(definitioninput).mergeMap(result => {
            this.hisDataType = result.hisDataType;
            this.useChannelObjectDirectory = result.registerFromDirectory;
            this.fields = result.fields;
            this.fields.forEach(field => {
                field.fieldTypeName = yibaoConsts.dataType[field.fieldType];
                if(this.canEdit){
                    field.value = this.tempfields[field.fieldName];
                }
            });

            let request2:QueryHisObjectInput = new QueryHisObjectInput();
            request2.hisDataType = this.hisDataType;
            return this.hisservice.queryEnabled(request2);
        }).subscribe(res => {
            this.useHisObjectDirectory = res;
        })
    }

    show(channel: string, itemid?: number): void {
        const self = this;
        self.active = true;
        self.channel  = channel;
        if (itemid) {
            this.canEdit = true;
            this.itemid = itemid;
            this.yibaoservice.get(itemid).subscribe(res => {
                this.tempfields = res.fields;
                this.channelObjectId = res.channelObjectId;
                this.channelObjectName = res.channelObjectName;
                this.hisObjectId = res.hisObjectId;
                this.hisObjectName = res.hisObjectName;
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


    save(): void{
        let channelobjectinput: ChannelObjectInput = new ChannelObjectInput();
        //channelobjectinput.his = 'Saas',
        channelobjectinput.channel = this.channel;
        channelobjectinput.channelObjectId = this.channelObjectId;
        channelobjectinput.objectType = 'ChargeItem';
        channelobjectinput.fields = {};
        channelobjectinput.channelObjectName = this.channelObjectName;

        this.fields.forEach(ele => {
            let filedName  = ele.filedName;
            channelobjectinput.fields[ele.fieldName] = ele.value;
            //Object.assign(channelobjectinput.fields,{ele[]);
        });

        if (this.canEdit) {
            let updatechannelobjectinput:UpdateChannelObjectInput = new UpdateChannelObjectInput();
            updatechannelobjectinput.id = this.itemid;
            for (const key in channelobjectinput) {
                if (channelobjectinput.hasOwnProperty(key)) {
                    updatechannelobjectinput[key] = channelobjectinput[key];
                    
                }
            }
            this.yibaoservice.update(updatechannelobjectinput).subscribe(result =>{
                this.notify.info('保存成功');
                this.close();
                this.modalSave.emit(null);
            });
        }else{
            this.yibaoservice.create(channelobjectinput).subscribe(result =>{
                this.notify.info('保存成功');
                this.close();
                this.modalSave.emit(null);
            });
        }
    }
}
