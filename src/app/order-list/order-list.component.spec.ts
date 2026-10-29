import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Order, OrderStatus } from '../types';
import { OrderListComponent } from './order-list.component';

function order(id: number, bookPrice: number, quantity: number): Order {
  return {
    id, bookIsbn: '1234567891', bookName: 'Northern Lights - Lyra Silverstar', bookPrice, quantity,
    status: OrderStatus.ACCEPTED
  };
}

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // The total of each order card, in order.
  function totals(orders: Order[]): string[] {
    httpTestingController.expectOne({ method: 'GET', url: '/orders' }).flush(orders);
    fixture.detectChanges();
    const items: Element[] = Array.from(fixture.nativeElement.querySelectorAll('mat-list-item'));
    return items.map(i => i.textContent!.trim()).filter(t => t.startsWith('Total:'));
  }

  it('should create', () => {
    httpTestingController.expectOne('/orders').flush([]);
    expect(component).toBeTruthy();
  });

  it('shows each order with its total', () => {
    expect(totals([order(42, 19.9, 3), order(43, 12.5, 2)])).toEqual(['Total: $59.70', 'Total: $25.00']);
  });

  // The template formats the total as dollars with the currency pipe (finding 40 in the main
  // repository: toPrecision(4) gave $9.900, $1235 and exponents from $10,000 up).
  it('shows the total in dollars and cents', () => {
    expect(totals([order(1, 9.9, 1), order(2, 123.45, 1), order(3, 1234.5, 1), order(4, 5000, 3)]))
      .toEqual(['Total: $9.90', 'Total: $123.45', 'Total: $1,234.50', 'Total: $15,000.00']);
  });
});
