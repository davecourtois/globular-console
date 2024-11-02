import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServicesComponent } from './services/services.component';
import { ClusterComponent } from './cluster/cluster.component';
import { UsersComponent } from './users/users.component';
import { GroupsComponent } from './groups/groups.component';
import { ApplicationsComponent } from './applications/applications.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { OrganizationsComponent } from './organizations/organizations.component';

@NgModule({
  declarations: [
    AppComponent,
    ServicesComponent,
    ClusterComponent,
    UsersComponent,
    GroupsComponent,
    ApplicationsComponent,
    RolesComponent,
    PermissionsComponent,
    OrganizationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { 

}
