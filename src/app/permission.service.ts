import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private _currentPermissionId: string | null = null;

  get currentPermissionId(): string | null {
    return this._currentPermissionId;
  }

  set currentPermissionId(value: string | null) {
    this._currentPermissionId = value;
  }
}