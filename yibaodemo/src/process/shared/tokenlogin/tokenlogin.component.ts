import { Component, OnInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { TokenService } from 'abp-ng2-module/dist/src/auth/token.service';
import { AppPreBootstrap } from 'AppPreBootstrap';


@Component({
    templateUrl: './tokenlogin.component.html',
})
export class TokenLoginComponent implements OnInit {
    token:string;
    expireInSeconds:number;
    userId:string;
    returnUrl:string;

    constructor(
        private _activateroute:ActivatedRoute,
        private _tokenService: TokenService,
    ) {

        this._activateroute.queryParams.subscribe(params =>{
            if(params != null){
                 this.token = params.token;
                this.expireInSeconds = params.expireInSeconds;
                this.userId = params.UserId;
                this.returnUrl = params.path;

                this.processLogin();
            }
        });
     }

    ngOnInit(): void { }

    processLogin():void {
        this.doprocessLogin(this.token,this.expireInSeconds,this.userId,this.returnUrl);
    }

    doprocessLogin(token:string,expireInSeconds:number,userId:string,returnUrl:string){
        let tokenExpireDate = new Date(new Date().getTime() + 1000 * expireInSeconds);

        this._tokenService.setToken(
            token,
            tokenExpireDate
        );

        if (returnUrl) {
            AppPreBootstrap.getUserConfiguration(() => {
                location.href = returnUrl;
            });
            // location.href = `/#${returnUrl}`;
            //console.log(location);
            // AppPreBootstrap.getUserConfiguration(() => {});

        }

    }

}
