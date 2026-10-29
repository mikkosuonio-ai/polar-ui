import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { OrderService } from '../order.service';
import { Book } from '../types';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';

import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

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
export class OrderDialogComponent {
  dialogRef = inject<MatDialogRef<OrderDialogComponent>>(MatDialogRef);
  book = inject<Book>(MAT_DIALOG_DATA);
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);

  bookQuantity = 1;

  submitOrder(): void {
    const orderRequest = {
      isbn: this.book.isbn,
      quantity: this.bookQuantity
    };
    this.orderService.submitOrder(orderRequest)
      .subscribe({
        next: () => this.dialogRef.close(),
        error: () => this.snackBar.open("The order can't be submitted. Please try again.", 'Close')
      });
  }

}
