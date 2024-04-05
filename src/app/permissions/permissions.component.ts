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

  }
}
