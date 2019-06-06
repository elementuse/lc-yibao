import { Component, OnInit } from '@angular/core';
import { CommonProcessService } from '../../process.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    templateUrl: './print-heilongjiang.component.html',
})
export class PrintHeilongjiangComponent implements OnInit {

    receipt = [];
    rmb:string;
    processId:string;
    protected subscription: Subscription;


    constructor(
        private commonservice:CommonProcessService,
        private route:ActivatedRoute
    ) { 
        this.subscription = this.route.queryParams.subscribe(
            (queryParams: any) => {
                if (queryParams.processId) {
                    this.processId = queryParams.processId;
                }
            }
        );
    }

    ngOnInit(): void { 
        this.getInternalStateWithData();

    }

    public getInternalStateWithData(){
        this.commonservice.getInternalStateWithData(this.processId).subscribe(res=>{
            this.receipt = res.result.dataStore.yibaoReceipts;
            this.rmb = this.smalltoBIG(this.receipt[0].page1[0].p14);
            setTimeout(() => {
                window.print();
                history.go(-1);
            }, 2000);
        });
    }

    public printSettlement(){
        window.print();
    }

    public smalltoBIG(n:number) {
        var fraction = ['角', '分'];
        var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        var unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
        var head = n < 0 ? '欠' : '';
        n = Math.abs(n);

        var s = '';

        for (var i = 0; i < fraction.length; i++) {
            s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
        }
        s = s || '整';
        n = Math.floor(n);

        for (var i = 0; i < unit[0].length && n > 0; i++) {
            var p = '';
            for (var j = 0; j < unit[1].length && n > 0; j++) {
                p = digit[n % 10] + unit[1][j] + p;
                n = Math.floor(n / 10);
            }
            s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
        }
        return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
    }  
}
