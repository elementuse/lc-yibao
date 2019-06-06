import { Component, OnInit, Injector, ViewChild } from "../../../node_modules/@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { ModalDirective } from "../../../node_modules/ngx-bootstrap";
import { ConstsHangzhou } from "./consts-hangzhou";

@Component({
    selector: "adviceHangzhouModal",
    templateUrl: "./advice-hangzhou.component.html"
})
export class AdviceHangzhouComponent extends AppComponentBase implements OnInit {

    public medical_name: string;

    public p20: number; //开方数量
    public p21: number; //开方单价
    public p22: string; //开方单位
    public p24: number; //每次用量
    public p25: string; //使用频次
    public p26: number; //执行天数
    public p23: string; //用法（给药途径）

    public chargeItem: any;
    public config = ConstsHangzhou.yibaoConfig;

    @ViewChild("adviceHangzhouModal") model: ModalDirective;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    show(chargeItem): void {
        this.clear();
        if(chargeItem.advice) {
            this.p20 = chargeItem.advice.p20;
            this.p21 = chargeItem.advice.p21;
            this.p22 = chargeItem.advice.p22;
            this.p24 = chargeItem.advice.p24;
            this.p25 = chargeItem.advice.p25;
            this.p26 = chargeItem.advice.p26;
            this.p23 = chargeItem.advice.p23;
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
        this.p20 = null;
        this.p21 = null;
        this.p22 = "";
        this.p24 = null;
        this.p25 = "";
        this.p26 = null;
        this.p23 = "";
    }

    save(): void {
        this.chargeItem.advice = {
            p20: this.p20,
            p21: this.p21,
            p22: this.p22,
            p24: this.p24,
            p25: this.p25,
            p26: this.p26,
            p23: this.p23
        };
        this.close();
    }
}
