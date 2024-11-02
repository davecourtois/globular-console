import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private _currentRoleId: string | null = null;

  get currentRoleId(): string | null {
    return this._currentRoleId;
  }

  set currentRoleId(value: string | null) {
    this._currentRoleId = value;
  }
}