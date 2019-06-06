import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcessComponent } from './process.component';
import { TokenLoginComponent } from './shared/tokenlogin/tokenlogin.component';
import { SelectChannelComponent } from './select/select-channel.component';
import { ProcessTaizhouComponent } from './taizhou/process-taizhou.component';
import { RefundTaizhouComponent } from './taizhou/refund-taizhou.component';

const routes: Routes = [
    {
        path: '', component: ProcessComponent,
        children: [
            { path: 'tokenlogin', component: TokenLoginComponent },
            { path: 'Taizhou', component: ProcessTaizhouComponent }
        ]
    },
    {
        path: 'refund', component: ProcessComponent,
        children: [
            { path: 'Taizhou', component: RefundTaizhouComponent }
        ]
    },
    {
        path: '**', redirectTo: '/app/main/dashboard'
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProcessRoutingModule { }
