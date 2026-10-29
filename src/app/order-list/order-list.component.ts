import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Order } from '../types';
import { OrderService } from '../order.service';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatGridList, MatGridTile, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatList,
    MatListItem, AsyncPipe
  ]
})
export class OrderListComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private orderService = inject(OrderService);

  orders: Order[] = [];

  colNumber = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => matches ? 2 : 3));

  ngOnInit(): void {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

}
