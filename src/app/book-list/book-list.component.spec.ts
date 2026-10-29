import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { OrderDialogComponent } from '../order-dialog/order-dialog.component';
import { Book } from '../types';
import { BookListComponent } from './book-list.component';

function book(isbn: string, title: string): Book {
  return { id: undefined, isbn, title, author: 'Lyra Silverstar', price: 9.9, publisher: 'Polarsophia' };
}

describe('BookListComponent', () => {
  let component: BookListComponent;
  let fixture: ComponentFixture<BookListComponent>;
  let httpTestingController: HttpTestingController;

  const northernLights = book('1234567891', 'Northern Lights');
  const subtleKnife = book('1234567892', 'The Subtle Knife');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BookListComponent ],
      // The template exports matMenu, which needs MatMenuModule even with NO_ERRORS_SCHEMA.
      imports: [ MatDialogModule, MatMenuModule, NoopAnimationsModule, RouterTestingModule ],
      providers: [ provideHttpClient(), provideHttpClientTesting() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function cardTitles(): string[] {
    const titles: Element[] = Array.from(fixture.nativeElement.querySelectorAll('mat-card-title'));
    return titles.map(t => t.textContent!.replace('more_vert', '').trim());
  }

  it('should create', () => {
    httpTestingController.expectOne('/books').flush([]);
    expect(component).toBeTruthy();
  });

  it('shows the books', () => {
    httpTestingController.expectOne({ method: 'GET', url: '/books' }).flush([northernLights, subtleKnife]);
    fixture.detectChanges();
    expect(cardTitles()).toEqual(['Northern Lights', 'The Subtle Knife']);
  });

  // The list used to keep a removed book until the page was loaded again (finding 37 in the
  // main repository's review).
  it('loads the list again after removing a book', () => {
    httpTestingController.expectOne('/books').flush([northernLights, subtleKnife]);
    fixture.detectChanges();

    component.removeBook(northernLights.isbn);
    httpTestingController.expectNone({ method: 'GET', url: '/books' });
    httpTestingController.expectOne({ method: 'DELETE', url: '/books/1234567891' })
      .flush(null, { status: 204, statusText: 'No Content' });
    httpTestingController.expectOne({ method: 'GET', url: '/books' }).flush([subtleKnife]);
    fixture.detectChanges();

    expect(cardTitles()).toEqual(['The Subtle Knife']);
  });

  it('opens the order dialog for a book and shows the orders when it closes', () => {
    httpTestingController.expectOne('/books').flush([northernLights]);
    const dialogRef = { afterClosed: () => of(undefined) } as MatDialogRef<OrderDialogComponent>;
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRef);
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    component.createOrder(northernLights);

    expect(open).toHaveBeenCalledWith(OrderDialogComponent, expect.objectContaining({ data: northernLights }));
    expect(navigateByUrl).toHaveBeenCalledWith('/my-orders');
  });
});
