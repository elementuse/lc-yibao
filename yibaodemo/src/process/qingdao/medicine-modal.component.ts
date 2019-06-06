import {
    Component,
    OnInit,
    Injector,
    ViewChild
} from "../../../node_modules/@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { ModalDirective } from "../../../node_modules/ngx-bootstrap";

@Component({
    selector: "medicineModal",
    templateUrl: "./medicine-modal.component.html"
})
export class MedicineQingdaoComponent extends AppComponentBase implements OnInit {

    public chargeItem: any;
    public medical_name: string;

    public mer_name: string; 
    public comm_name: string;
    public mer_name_short: string;
    public std_doc_id: string;
    public pro_batch_id: string;
    public batch: string;
    public pro_enterprise: string;
    public gmp_cert_id: string;
    public mer_specification: string;
    public che_name: string;
    public mer_biz_code: string;

    @ViewChild("medicineModal") model: ModalDirective;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    show(chargeItem): void {
        this.clear();
        if(chargeItem.channelData) {
            this.mer_name = chargeItem.channelData.mer_name;
            this.comm_name = chargeItem.channelData.comm_name;
            this.mer_name_short = chargeItem.channelData.mer_name_short;
            this.std_doc_id = chargeItem.channelData.std_doc_id;
            this.pro_batch_id = chargeItem.channelData.pro_batch_id;
            this.batch = chargeItem.channelData.batch;
            this.pro_enterprise = chargeItem.channelData.pro_enterprise;
            this.gmp_cert_id = chargeItem.channelData.gmp_cert_id;
            this.mer_specification = chargeItem.channelData.mer_specification;
            this.che_name = chargeItem.channelData.che_name;
            this.mer_biz_code = chargeItem.channelData.mer_biz_code;
        }
        this.chargeItem = chargeItem;
        this.medical_name = chargeItem.name;
        this.model.show();
    }

    close(): void {
        this.clear();
        this.model.hide();
    }

    clear(): void {
        this.medical_name = '';
        this.mer_name = '';
        this.comm_name = '';
        this.mer_name_short = '';
        this.std_doc_id = '';
        this.pro_batch_id = '';
        this.batch = '';
        this.pro_enterprise = '';
        this.gmp_cert_id = '';
        this.mer_specification = '';
        this.che_name = '';
        this.mer_biz_code = '';
    }

    save(): void {
        this.chargeItem.channelData.mer_name = this.mer_name;
        this.chargeItem.channelData.comm_name = this.comm_name;
        this.chargeItem.channelData.mer_name_short = this.mer_name_short;
        this.chargeItem.channelData.std_doc_id = this.std_doc_id;
        this.chargeItem.channelData.pro_batch_id = this.pro_batch_id;
        this.chargeItem.channelData.batch = this.batch;
        this.chargeItem.channelData.pro_enterprise = this.pro_enterprise;
        this.chargeItem.channelData.gmp_cert_id = this.gmp_cert_id;
        this.chargeItem.channelData.mer_specification = this.mer_specification;
        this.chargeItem.channelData.che_name = this.che_name;
        this.chargeItem.channelData.mer_biz_code = this.mer_biz_code;
        this.close();
    }
}