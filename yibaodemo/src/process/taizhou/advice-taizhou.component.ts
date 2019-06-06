import { Component, OnInit, Injector, ViewChild } from "../../../node_modules/@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { ModalDirective } from "../../../node_modules/ngx-bootstrap";
import { ConstsTaizhou } from "./consts-taizhou";

@Component({
    selector: "adviceTaizhouModal",
    templateUrl: "./advice-taizhou.component.html"
})
export class AdviceTaizhouComponent extends AppComponentBase implements OnInit {

    public medical_name: string;

    public yypc: string; //用药频次
    public mcyl: number; //每次用量
    public yyts: number; //用药天数
    public yf: string; //用法

    public chargeItem: any;
    public config = ConstsTaizhou.yibaoConfig;

    @ViewChild("adviceTaizhouModal") model: ModalDirective;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {}

    show(chargeItem): void {
        this.clear();
        if(chargeItem.advice) {
            this.yypc = chargeItem.advice.yypc;
            this.mcyl = chargeItem.advice.mcyl;
            this.yyts = chargeItem.advice.yyts;
            this.yf = chargeItem.advice.yf;
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
        this.yypc = "";
        this.mcyl = null;
        this.yyts = null;
        this.yf = "";
    }

    save(): void {
        this.chargeItem.advice = {
            yypc: this.yypc,
            mcyl: this.mcyl,
            yyts: this.yyts,
            yf: this.yf
        };
        this.close();
    }
}
