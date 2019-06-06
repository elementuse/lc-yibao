import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ProviderComponent } from '@app/yibao/provider/provider.component';

const routes: Routes = [
    { path: '**', component: ProviderComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProviderRoutingModule {
    
}
