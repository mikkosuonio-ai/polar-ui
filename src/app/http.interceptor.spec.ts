import type { Mocked } from 'vitest';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { HttpInterceptorImpl } from './http.interceptor';

describe('HttpInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: Mocked<AuthService>;

  beforeEach(() => {
    authService = { login: vi.fn() } as unknown as Mocked<AuthService>;
    TestBed.configureTestingModule({
        providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        HttpInterceptorImpl,
        { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorImpl, multi: true },
        { provide: AuthService, useValue: authService }
        ]
      });
      httpClient = TestBed.inject(HttpClient);
      httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
      httpTestingController.verify();
  });

  it('should be created', () => {
      const interceptor: HttpInterceptorImpl = TestBed.inject(HttpInterceptorImpl);
      expect(interceptor).toBeTruthy();
  });

  // Spring Security answers such requests with 401 instead of a redirect to the login page.
  it('marks requests as XMLHttpRequest', () => {
      httpClient.get('/books').subscribe();
      const request = httpTestingController.expectOne('/books');
      expect(request.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
      request.flush([]);
  });

  it('sends the visitor to log in on a 401', () => {
      httpClient.get('/orders').subscribe({ error: () => undefined });
      httpTestingController.expectOne('/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(authService.login).toHaveBeenCalledTimes(1);
  });

  // GET /user answers 401 on every page load of an anonymous visitor.
  it('only logs a 401 on /user', () => {
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      httpClient.get('/user').subscribe({ error: () => undefined });
      httpTestingController.expectOne('/user').flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(authService.login).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Unauthenticated session');
  });

  it('leaves other errors to the caller', () => {
      let status: number | undefined;
      httpClient.post('/books', {}).subscribe({ error: e => status = e.status });
      httpTestingController.expectOne('/books').flush(null, { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
      expect(authService.login).not.toHaveBeenCalled();
  });
    });
