import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  @ViewChild('userManager') userManagerElement!: ElementRef;
  currentUserId: string | null = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-user-id']!=null){
        this.currentUserId = params['current-user-id'];
        this.userService.currentUserId = this.currentUserId;
      }else if(this.userService.currentUserId!=null){
        this.currentUserId = this.userService.currentUserId;
        this.updateUrlWithUserId(this.currentUserId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentUserIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newUserId = event.detail;
        this.userService.currentUserId = newUserId;
        
        // Update the URL with the new user ID
        this.updateUrlWithUserId(newUserId);
      });
    });
  }

  updateUrlWithUserId(userId: string) {
    // Navigate with the new query parameter
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-user-id': userId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }
}