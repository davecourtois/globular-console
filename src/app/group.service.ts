import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private _currentGroupId: string | null = null;

  get currentGroupId(): string | null {
    return this._currentGroupId;
  }

  set currentGroupId(value: string | null) {
    this._currentGroupId = value;
  }
}