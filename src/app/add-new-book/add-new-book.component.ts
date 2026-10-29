import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
export class AddNewBookComponent implements OnInit {

  constructor(private bookService: BookService, private router: Router) { }

  ngOnInit(): void {
  }

  onSubmit(book: Book): void {
    this.bookService.addBook(book)
      .subscribe(() => {
        this.router.navigateByUrl('/browse-books');
      });
  }

}
