import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaizhouSettingComponent } from '@app/yibao/setting/taizhou/taizhou-setting.component';

const routes: Routes = [
    {
        path: '',
        children: [
            { path: 'Taizhou', component: TaizhouSettingComponent}
        ]
    }
];

@NgModule({
    imports: [CommonModule, RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SettingRoutingModule { }
