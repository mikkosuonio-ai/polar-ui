import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderRequest } from './types';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private httpClient = inject(HttpClient);

  getOrders(): Observable<Order[]> {
    return this.httpClient.get<Order[]>('/orders');
  }

  submitOrder(orderRequest: OrderRequest): Observable<Order> {
    return this.httpClient.post<Order>(`/orders`,
      orderRequest,
      httpOptions
    );
  }
}
