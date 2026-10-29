import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpInterceptorImpl implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const finalRequest = this.prepareRequest(request);
    return next.handle(finalRequest).pipe(tap({
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          if (!request.url.endsWith('/user') && err.status === 401) {
            this.authService.login();
          } else if (request.url.endsWith('/user') && err.status === 401) {
            console.log('Unauthenticated session');
          }
        }
      }
    }));
  }

  prepareRequest(request: HttpRequest<unknown>): HttpRequest<unknown> {
    if (request.url.endsWith('post')) {
      return request.clone();
    }
    return request.clone({
      headers: request.headers.set('X-Requested-With', 'XMLHttpRequest')
    });
  }
}
