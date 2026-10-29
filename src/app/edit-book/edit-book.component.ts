import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../types';
import { BookFormComponent } from '../book-form/book-form.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-book',
  templateUrl: './edit-book.component.html',
  styleUrls: ['./edit-book.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BookFormComponent, MatProgressSpinner]
})
export class EditBookComponent implements OnInit {

  book!: Book;

  constructor(private route: ActivatedRoute, private bookService: BookService, private router: Router) { }

  ngOnInit(): void {
    const isbn = this.route.snapshot.paramMap.get('isbn') as string;
    this.bookService.getBookByIsbn(isbn)
      .subscribe(book => this.book = book);
  }

  onSubmit(book: Book): void {
    this.bookService.editBook(book)
      .subscribe(() => {
        this.router.navigateByUrl('/browse-books');
      });
  }

}
