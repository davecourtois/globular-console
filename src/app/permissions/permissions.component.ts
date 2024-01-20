import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PermissionService } from '../permission.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent {
  @ViewChild('permissionManager') permissionManagerElement!: ElementRef;
  currentPermissionId: string | null = null;

  constructor(
    private PermissionService: PermissionService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-permission-id']!=null){
        this.currentPermissionId = params['current-permission-id'];
        this.PermissionService.currentPermissionId = this.currentPermissionId;
      }else if(this.PermissionService.currentPermissionId!=null){
        this.currentPermissionId = this.PermissionService.currentPermissionId;
        this.updateUrlWithPermissionId(this.currentPermissionId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentPermissionIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newPermissionId = event.detail;
        this.PermissionService.currentPermissionId = newPermissionId;
        
        // Update the URL with the new user ID
        this.updateUrlWithPermissionId(newPermissionId);
      });
    });
  }

  updateUrlWithPermissionId(permissionId: string) {
    // Navigate with the new query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-permission-id': permissionId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }
  
}
