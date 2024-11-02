import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { OrganizationService } from '../organization.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.css']
})
export class OrganizationsComponent {
  @ViewChild('organizationManager') organizationManagerElement!: ElementRef;
  currentOrganizationId: string | null = null;

  constructor(
    private organizationService: OrganizationService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-organization-id']!=null){
        this.currentOrganizationId = params['current-organization-id'];
        this.organizationService.currentOrganizationId = this.currentOrganizationId;
      }else if(this.organizationService.currentOrganizationId!=null){
        this.currentOrganizationId = this.organizationService.currentOrganizationId;
        this.updateUrlWithOrganizationId(this.currentOrganizationId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentOrganizationIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newOrganizationId = event.detail;
        this.organizationService.currentOrganizationId = newOrganizationId;
        
        // Update the URL with the new user ID
        this.updateUrlWithOrganizationId(newOrganizationId);
      });
    });
  }

  updateUrlWithOrganizationId(organizationId: string) {
    // Navigate with the new query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-organization-id': organizationId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }

}
