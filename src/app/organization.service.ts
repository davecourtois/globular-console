import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private _currentOrganizationId: string | null = null;

  get currentOrganizationId(): string | null {
    return this._currentOrganizationId;
  }

  set currentOrganizationId(value: string | null) {
    this._currentOrganizationId = value;
  }
}