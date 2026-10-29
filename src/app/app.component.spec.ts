import { LayoutModule } from '@angular/cdk/layout';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { config } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth.service';
import { User } from './types';

describe('AppComponent', () => {

  let httpTestingController: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        NoopAnimationsModule,
        LayoutModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
        RouterTestingModule
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  }));

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

    // AppComponent subscribes to GET /user without an error handler, so RxJS reports its 401 as
    // unhandled in a timeout, which would otherwise fail a later spec. The specs run in fakeAsync
    // and flush that timeout.
    beforeEach(() => {
      onUnhandledError = config.onUnhandledError;
      config.onUnhandledError = jasmine.createSpy('onUnhandledError');
    });

    afterEach(() => {
      config.onUnhandledError = onUnhandledError;
    });

    it('shows "Log In" and only "Browse Books" in the menu', fakeAsync(() => {
      const fixture = render();
      flush();
      expect(config.onUnhandledError).toHaveBeenCalled();
      expect(texts(fixture, 'mat-toolbar button')).toContain('Log In');
      expect(texts(fixture, 'mat-toolbar button')).not.toContain('Log Out');
      expect(menuLinks(fixture)).toEqual(['Browse Books']);
    }));

    it('logs in with "Log In"', fakeAsync(() => {
      const authService = TestBed.inject(AuthService);
      spyOn(authService, 'login');
      const fixture = render();
      const logIn: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-toolbar button'));
      logIn.find(b => b.textContent!.includes('Log In'))!.click();
      expect(authService.login).toHaveBeenCalled();
      flush();
    }));
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
