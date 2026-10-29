import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Book } from '../types';
import { BookService } from '../book.service';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OrderDialogComponent } from '../order-dialog/order-dialog.component';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatGridList, MatGridTile, MatCard, MatCardHeader, MatCardTitle, MatIconButton, MatMenuTrigger,
    MatIcon, MatMenu, MatMenuItem, RouterLink, MatCardContent, MatList, MatListItem,
    MatCardActions, MatButton, MatProgressSpinner, AsyncPipe
  ]
})
export class BookListComponent implements OnInit {
  dialog = inject(MatDialog);
  private bookService = inject(BookService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  books: Book[] = [];

  colNumber = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => matches ? 2 : 3));

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(books => this.books = books);
  }

  removeBook(isbn: string): void {
    this.bookService.deleteBook(isbn)
      .subscribe(() => {
        this.loadBooks();
      });
  }

  createOrder(book: Book): void {
    const dialogRef = this.dialog.open(OrderDialogComponent, {
      width: '250px',
      data: book
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigateByUrl('/my-orders');
    });
  }

}
