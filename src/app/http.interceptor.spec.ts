import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpInterceptorImpl } from './http.interceptor';

describe('HttpInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      HttpInterceptorImpl
      ]
  }));

  it('should be created', () => {
    const interceptor: HttpInterceptorImpl = TestBed.inject(HttpInterceptorImpl);
    expect(interceptor).toBeTruthy();
  });
});
