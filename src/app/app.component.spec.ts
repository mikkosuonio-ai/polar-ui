import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { config } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth.service';
import { User } from './types';

describe('AppComponent', () => {

  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // Renders the component with GET /user answered by USER, or by 401 without one.
  function render(user?: User): ComponentFixture<AppComponent> {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const request = httpTestingController.expectOne('/user');
    if (user) {
      request.flush(user);
    } else {
      request.flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    fixture.detectChanges();
    return fixture;
  }

  function texts(fixture: ComponentFixture<AppComponent>, selector: string): string[] {
    const elements: Element[] = Array.from(fixture.nativeElement.querySelectorAll(selector));
    return elements.map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  }

  // The side menu's links, without their icons' names.
  function menuLinks(fixture: ComponentFixture<AppComponent>): string[] {
    const links: Element[] = Array.from(fixture.nativeElement.querySelectorAll('mat-nav-list a'));
    return links.map(a => a.textContent!.replace(a.querySelector('mat-icon')!.textContent!, '').trim());
  }

  function user(...roles: string[]): User {
    return { id: 'id', username: 'user', firstName: 'First', lastName: 'Last', roles };
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Polar Bookshop'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Polar Bookshop');
  });

  describe('for an anonymous visitor', () => {
    let onUnhandledError: typeof config.onUnhandledError;

    // AppComponent handles GET /user's 401, so RxJS has no unhandled error to report, which it
    // would do in a timeout. The specs fake the timers and run any such timeout.
    beforeEach(() => {
      vi.useFakeTimers();
      onUnhandledError = config.onUnhandledError;
      config.onUnhandledError = vi.fn();
    });

    afterEach(() => {
      config.onUnhandledError = onUnhandledError;
      vi.useRealTimers();
    });

    it('shows "Log In" and only "Browse Books" in the menu', () => {
      const fixture = render();
      vi.runAllTimers();
      expect(config.onUnhandledError).not.toHaveBeenCalled();
      expect(texts(fixture, 'mat-toolbar button')).toContain('Log In');
      expect(texts(fixture, 'mat-toolbar button')).not.toContain('Log Out');
      expect(menuLinks(fixture)).toEqual(['Browse Books']);
    });

    it('logs in with "Log In"', () => {
      const authService = TestBed.inject(AuthService);
      vi.spyOn(authService, 'login').mockReturnValue(undefined);
      const fixture = render();
      const logIn: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-toolbar button'));
      logIn.find(b => b.textContent!.includes('Log In'))!.click();
      expect(authService.login).toHaveBeenCalled();
      vi.runAllTimers();
    });
  });

  it('shows a customer "Log Out" and "My Orders", but not "Add Book"', () => {
    const fixture = render(user('customer'));
    expect(texts(fixture, 'mat-toolbar button')).toContain('Log Out');
    expect(texts(fixture, 'mat-toolbar button')).not.toContain('Log In');
    expect(menuLinks(fixture)).toEqual(['Browse Books', 'My Orders']);
  });

  it('shows an employee "Log Out", "Add Book" and "My Orders"', () => {
    const fixture = render(user('employee', 'customer'));
    expect(texts(fixture, 'mat-toolbar button')).toContain('Log Out');
    expect(menuLinks(fixture)).toEqual(['Browse Books', 'Add Book', 'My Orders']);
  });

  it('logs out with a form that posts the CSRF token', () => {
    document.cookie = 'XSRF-TOKEN=token-value';
    try {
      const fixture = render(user('customer'));
      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      expect(form.getAttribute('action')).toBe('/logout');
      expect(form.getAttribute('method')).toBe('post');
      expect((form.querySelector('input[name=_csrf]') as HTMLInputElement).value).toBe('token-value');
    } finally {
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });

});
