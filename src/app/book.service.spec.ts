import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BookService } from './book.service';
import { Book } from './types';

describe('BookService', () => {
  let service: BookService;
  let httpTestingController: HttpTestingController;

  const book: Book = {
    id: 1, isbn: '1234567891', title: 'Northern Lights', author: 'Lyra Silverstar', price: 9.9, publisher: 'Polarsophia'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BookService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets the books', () => {
    let books: Book[] | undefined;
    service.getBooks().subscribe(b => books = b);
    const request = httpTestingController.expectOne({ method: 'GET', url: '/books' });
    request.flush([book]);
    expect(books).toEqual([book]);
  });

  it('gets a book by its ISBN', () => {
    let found: Book | undefined;
    service.getBookByIsbn(book.isbn).subscribe(b => found = b);
    httpTestingController.expectOne({ method: 'GET', url: '/books/1234567891' }).flush(book);
    expect(found).toEqual(book);
  });

  it('adds a book', () => {
    service.addBook(book).subscribe();
    const request = httpTestingController.expectOne({ method: 'POST', url: '/books' });
    expect(request.request.body).toEqual(book);
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush(book, { status: 201, statusText: 'Created' });
  });

  it('edits a book at its ISBN', () => {
    service.editBook(book).subscribe();
    const request = httpTestingController.expectOne({ method: 'PUT', url: '/books/1234567891' });
    expect(request.request.body).toEqual(book);
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush(book);
  });

  it('deletes a book by its ISBN', () => {
    let deleted = false;
    service.deleteBook(book.isbn).subscribe(() => deleted = true);
    httpTestingController.expectOne({ method: 'DELETE', url: '/books/1234567891' })
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(deleted).toBe(true);
  });
});
