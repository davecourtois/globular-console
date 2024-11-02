import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GroupService } from '../group.service';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute and Router


@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent {

  @ViewChild('groupManager') groupManagerElement!: ElementRef;
  currentGroupId: string | null = null;

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router // Inject Router
  ) { }

  ngOnInit() {// Subscribe to query parameters to get the current user ID
    this.route.queryParams.subscribe(params => {
      if(params['current-group-id']!=null){
        this.currentGroupId = params['current-group-id'];
        this.groupService.currentGroupId = this.currentGroupId;
      }else if(this.groupService.currentGroupId!=null){
        this.currentGroupId = this.groupService.currentGroupId;
        this.updateUrlWithGroupId(this.currentGroupId);
      }
    });

    // Wait for the view to be initialized
    setTimeout(() => {
      document.addEventListener('currentGroupIdChanged', (event: any) => {
        // Handle the event and update your Angular component or service
        const newGroupId = event.detail;
        this.groupService.currentGroupId = newGroupId;
        
        // Update the URL with the new user ID
        this.updateUrlWithGroupId(newGroupId);
      });
    });
  }

  updateUrlWithGroupId(groupId: string) {
    // Navigate with the new query parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 'current-group-id': groupId },
      queryParamsHandling: 'merge', // This will merge with existing query params
      replaceUrl: true // This prevents adding history entries for each change
    });
  }

}
