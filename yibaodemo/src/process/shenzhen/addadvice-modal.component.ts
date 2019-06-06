import {
    Component,
    OnInit,
    Injector,
    ViewChild,
    Output,
    EventEmitter
} from "../../../node_modules/@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { ModalDirective } from "../../../node_modules/ngx-bootstrap";
import { processConsts } from "../shared/processConsts";

@Component({
    selector: "addAdviceModal",
    templateUrl: "./addadvice-modal.component.html"
})
export class AddAdviceComponent extends AppComponentBase implements OnInit {

    public medical_name: string;

    public use_day: number; //用药天数（项目为药品时非空），医嘱服用该药品天数，必须使用数值型，如”15”
    public single_dose_number: number; //单次用药量（项目为药品时非空），配合下一个字段的单位，如 50 mg，必须使用数值型，如”50”
    public single_dose_unit: string; //单次用药量剂量单位（项目为药品时非空）
    public single_take_number: number; //单次服用药品数量（项目为药品时非空），配合下一个字段的单位，如 1片，必须使用数值型，如”1”
    public single_take_unit: string; //单次服用药品数量单位（项目为药品时非空），具体可使用药品数量单位
    public take_medical_number: number; //取药总量（项目为药品时非空），配合下一个字段的单位，如 500 mg，必须使用数值型，如”500”
    public take_medical_unit: string; //取药总量剂量单位（项目为药品时非空），具体可使用剂量单位
    public dose_day: number; //药量天数（项目为药品时非空），依据医嘱服药要求，所配药品患者可以服用的天数，必须使用数值型，如”5”
    public take_frequence: string; //服用频次

    public chargeItem: any;
    public config = processConsts.shenzhenWisdomConfig;

    @ViewChild("addAdviceModal") model: ModalDirective;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    show(chargeItem): void {
        this.clear();
        if(chargeItem.advice) {
            this.use_day = chargeItem.advice.use_day;
            this.single_dose_number = chargeItem.advice.single_dose_number;
            this.single_dose_unit = chargeItem.advice.single_dose_unit;
            this.single_take_number = chargeItem.advice.single_take_number;
            this.single_take_unit = chargeItem.advice.single_take_unit;
            this.take_medical_number = chargeItem.advice.take_medical_number;
            this.take_medical_unit = chargeItem.advice.take_medical_unit;
            this.dose_day = chargeItem.advice.dose_day;
            this.take_frequence = chargeItem.advice.take_frequence;
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
        this.use_day = null;
        this.single_dose_number = null;
        this.single_dose_unit = "";
        this.single_take_number = null;
        this.single_take_unit = "";
        this.take_medical_number = null;
        this.take_medical_unit = "";
        this.dose_day = null;
        this.take_frequence = "";
    }

    save(): void {
        this.chargeItem.advice = {
            use_day: this.use_day,
            single_dose_number: this.single_dose_number,
            single_dose_unit: this.single_dose_unit,
            single_take_number: this.single_take_number,
            single_take_unit: this.single_take_unit,
            take_medical_number: this.take_medical_number,
            take_medical_unit: this.take_medical_unit,
            dose_day: this.dose_day,
            take_frequence: this.take_frequence
        };
        this.close();
    }
}
