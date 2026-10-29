import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../types';
import { BookFormComponent } from '../book-form/book-form.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-book',
  templateUrl: './edit-book.component.html',
  styleUrls: ['./edit-book.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BookFormComponent, MatProgressSpinner]
})
export class EditBookComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  book: Book | undefined;
  loadFailed = false;

  ngOnInit(): void {
    const isbn = this.route.snapshot.paramMap.get('isbn') as string;
    this.bookService.getBookByIsbn(isbn)
      .subscribe({
        next: book => this.book = book,
        error: () => this.loadFailed = true
      });
  }

  onSubmit(book: Book): void {
    this.bookService.editBook(book)
      .subscribe({
        next: () => this.router.navigateByUrl('/browse-books'),
        error: () => this.snackBar.open("The book can't be updated. Please try again.", 'Close')
      });
  }

}
