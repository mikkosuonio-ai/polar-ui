import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OrderService } from './order.service';
import { Order, OrderStatus } from './types';

describe('OrderService', () => {
  let service: OrderService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(OrderService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets the orders', () => {
    const order: Order = {
      id: 1, bookIsbn: '1234567891', bookName: 'Northern Lights - Lyra Silverstar', bookPrice: 9.9, quantity: 2,
      status: OrderStatus.ACCEPTED
    };
    let orders: Order[] | undefined;
    service.getOrders().subscribe(o => orders = o);
    httpTestingController.expectOne({ method: 'GET', url: '/orders' }).flush([order]);
    expect(orders).toEqual([order]);
  });

  it('submits an order', () => {
    service.submitOrder({ isbn: '1234567891', quantity: 2 }).subscribe();
    const request = httpTestingController.expectOne({ method: 'POST', url: '/orders' });
    expect(request.request.body).toEqual({ isbn: '1234567891', quantity: 2 });
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush({});
  });
});
