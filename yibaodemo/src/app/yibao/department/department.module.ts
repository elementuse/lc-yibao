import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentRoutingModule } from '@app/yibao/department/department-routing.module';
import { DepartmentComponent } from '@app/yibao/department/department.component';
import { CreateDepartmentComponent } from '@app/yibao/department/create-department-modal.component';
import { RegisterDepartmentComponent } from '@app/yibao/department/register-department-modal.component';
import { ModalModule } from 'ngx-bootstrap';
import { FormsModule } from '@angular/forms';
import { UtilsModule } from '@shared/utils/utils.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
@NgModule({
    declarations: [
        DepartmentComponent,
        CreateDepartmentComponent,
        RegisterDepartmentComponent
    ],
    imports: [ 
        CommonModule,
        DepartmentRoutingModule,
        FormsModule,
        UtilsModule,
        TableModule,
        PaginatorModule,
        ModalModule.forRoot(),
    ],
    exports: [],
    providers: [],
})
export class DepartmentModule {}