import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RoleService } from '../role.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {
  @ViewChild('roleManager') roleManagerElement!: ElementRef;
  currentRoleId: string | null = null;

  constructor(
    private RoleService: RoleService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-role-id']!=null){
        this.currentRoleId = params['current-role-id'];
        this.RoleService.currentRoleId = this.currentRoleId;
      }else if(this.RoleService.currentRoleId!=null){
        this.currentRoleId = this.RoleService.currentRoleId;
        this.updateUrlWithGroupId(this.currentRoleId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentRoleIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newGroupId = event.detail;
        this.RoleService.currentRoleId = newGroupId;
        
        // Update the URL with the new user ID
        this.updateUrlWithGroupId(newGroupId);
      });
    });
  }

  updateUrlWithGroupId(groupId: string) {
    // Navigate with the new query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-role-id': groupId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }

}
