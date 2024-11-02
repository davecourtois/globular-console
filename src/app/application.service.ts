import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private _currentApplicationId: string | null = null;

  get currentApplicationId(): string | null {
    return this._currentApplicationId;
  }

  set currentApplicationId(value: string | null) {
    this._currentApplicationId = value;
  }
}