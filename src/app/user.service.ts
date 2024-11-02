import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _currentUserId: string | null = null;

  get currentUserId(): string | null {
    return this._currentUserId;
  }

  set currentUserId(value: string | null) {
    this._currentUserId = value;
  }
}