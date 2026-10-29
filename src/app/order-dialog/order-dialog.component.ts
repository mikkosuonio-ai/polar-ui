import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookService } from '../book.service';
import { OrderService } from '../order.service';
import { Book } from '../types';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-order-dialog',
  templateUrl: './order-dialog.component.html',
  styleUrls: ['./order-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, FormsModule,
    MatDialogActions, MatButton
  ]
})
export class OrderDialogComponent implements OnInit {

  book: Book;
  bookQuantity = 1;

  constructor(
    public dialogRef: MatDialogRef<OrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Book,
    private orderService: OrderService,
  ) {
    this.book = data;
  }

  ngOnInit(): void {
  }

  submitOrder(): void {
    const orderRequest = {
      isbn: this.book.isbn,
      quantity: this.bookQuantity
    };
    this.orderService.submitOrder(orderRequest)
      .subscribe(() => this.dialogRef.close());
  }

}
