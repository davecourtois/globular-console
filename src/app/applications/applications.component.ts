import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationService } from '../application.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router


@Component({
  selector: 'app-Applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent {

  @ViewChild('applicationManager') applicationManagerElement!: ElementRef;
  currentApplicationId: string | null = null;

  constructor(
    private ApplicationService: ApplicationService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-application-id']!=null){
        this.currentApplicationId = params['current-application-id'];
        this.ApplicationService.currentApplicationId = this.currentApplicationId;
      }else if(this.ApplicationService.currentApplicationId!=null){
        this.currentApplicationId = this.ApplicationService.currentApplicationId;
        this.updateUrlWithApplicationId(this.currentApplicationId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentApplicationIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newApplicationId = event.detail;
        this.ApplicationService.currentApplicationId = newApplicationId;
        
        // Update the URL with the new user ID
        this.updateUrlWithApplicationId(newApplicationId);
      });
    });
  }

  updateUrlWithApplicationId(ApplicationId: string) {
    // Navigate with the new query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-application-id': ApplicationId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }

}
