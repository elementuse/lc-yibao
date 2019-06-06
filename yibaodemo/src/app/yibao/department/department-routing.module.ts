import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DepartmentComponent } from '@app/yibao/department/department.component';

const routes: Routes = [
    { path: '**', component: DepartmentComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DepartmentRoutingModule {
    
}
