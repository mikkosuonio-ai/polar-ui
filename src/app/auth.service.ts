import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from './types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private location = inject(Location);
  private httpXsrfTokenExtractor = inject(HttpXsrfTokenExtractor);

  authenticate(): Observable<User> {
    return this.httpClient.get<User>('/user');
  }

  login(): void {
    window.open('/oauth2/authorization/keycloak', '_self');
  }

  logout(): Observable<unknown> {
    const formData = new FormData();
    formData.append('_csrf', this.httpXsrfTokenExtractor.getToken() ?? '');
    return this.httpClient.post('/logout', formData);
  }

}
