import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaizhouCheckComponent } from '@app/yibao/check/taizhou/taizhou-check.component';

const routes: Routes = [
    {
        path: '',
        children: [
            { path: 'Taizhou', component: TaizhouCheckComponent}
        ]
    }
];

@NgModule({
    imports: [CommonModule, RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CheckRoutingModule { }
