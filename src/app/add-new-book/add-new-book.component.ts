import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../book.service';
import { Book } from '../types';
import { BookFormComponent } from '../book-form/book-form.component';

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

  onSubmit(book: Book): void {
    this.bookService.addBook(book)
      .subscribe(() => {
        this.router.navigateByUrl('/browse-books');
      });
  }

}
