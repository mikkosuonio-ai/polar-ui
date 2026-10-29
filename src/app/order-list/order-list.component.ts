import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Order } from '../types';
import { OrderService } from '../order.service';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatGridList, MatGridTile, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatList,
    MatListItem, MatProgressSpinner, AsyncPipe, CurrencyPipe
  ]
})
export class OrderListComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private orderService = inject(OrderService);

  // Undefined until the orders are loaded, so the page shows a spinner meanwhile.
  orders: Order[] | undefined;
  loadFailed = false;

  colNumber = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => matches ? 2 : 3));

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: orders => this.orders = orders,
      error: () => this.loadFailed = true
    });
  }

}
