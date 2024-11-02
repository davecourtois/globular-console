import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// the home component
import { ClusterComponent } from './cluster/cluster.component';
import { ServicesComponent } from './services/services.component';
import { UsersComponent } from './users/users.component';
import { ApplicationsComponent } from './applications/applications.component';
import { GroupsComponent } from './groups/groups.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { OrganizationsComponent } from './organizations/organizations.component';

const routes: Routes = [
  { path: '', component: ClusterComponent },
  { path: 'cluster', redirectTo: '/', pathMatch: 'full' },
  { path: 'services', component: ServicesComponent },
  { path: 'users', component: UsersComponent},
  { path: 'applications', component: ApplicationsComponent},
  { path: 'groups', component: GroupsComponent},
  { path: 'roles', component: RolesComponent},
  { path: 'permissions', component: PermissionsComponent},
  { path: 'organizations', component: OrganizationsComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
