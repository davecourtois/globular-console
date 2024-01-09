import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// the home component
import { ClusterComponent } from './cluster/cluster.component';
import { ServicesComponent } from './services/services.component';

const routes: Routes = [
  { path: '', component: ClusterComponent },
  { path: 'cluster', redirectTo: '/', pathMatch: 'full' },
  { path: 'services', component: ServicesComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
