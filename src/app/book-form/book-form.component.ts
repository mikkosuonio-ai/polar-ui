import { EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Output } from '@angular/core';
import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Book } from '../types';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-book-form',
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatFormField, MatLabel,
    MatInput, MatCardActions, MatButton
  ]
})
export class BookFormComponent implements OnInit {

  @Input() buttonText = 'Submit';
  @Input() titleText = 'Book Information';
  @Input() currentBook: Book | undefined;
  @Output() onSubmit = new EventEmitter<Book>();

  book: Book = {
    id: undefined,
    isbn: '',
    title: '',
    author: '',
    price: 0,
    publisher: ''
  };

  constructor() { }

  ngOnInit(): void {
    if (this.currentBook) {
      this.book = this.currentBook;
    }
  }

  onButtonClicked(): void {
    this.onSubmit.emit(this.book);
  }

}
