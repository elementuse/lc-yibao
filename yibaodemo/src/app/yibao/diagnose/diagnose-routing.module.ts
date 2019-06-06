import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DiagnoseComponent } from '@app/yibao/diagnose/diagnose.component'

const routes: Routes = [
    { path: '**', component: DiagnoseComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DiagnoseRoutingModule {}
