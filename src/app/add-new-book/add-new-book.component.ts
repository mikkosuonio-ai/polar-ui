import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../types';
import { BookFormComponent } from '../book-form/book-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-new-book',
  templateUrl: './add-new-book.component.html',
  styleUrls: ['./add-new-book.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BookFormComponent]
})
export class AddNewBookComponent {
  private bookService = inject(BookService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  onSubmit(book: Book): void {
    this.bookService.addBook(book)
      .subscribe({
        next: () => this.router.navigateByUrl('/browse-books'),
        error: () => this.snackBar.open("The book can't be created. Please try again.", 'Close')
      });
  }

}
