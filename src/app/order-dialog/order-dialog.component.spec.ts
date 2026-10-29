import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Book } from '../types';
import { OrderDialogComponent } from './order-dialog.component';

const book: Book = {
  id: 1, isbn: '1234567891', title: 'Northern Lights', author: 'Lyra Silverstar', price: 9.9, publisher: 'Polarsophia'
};

describe('OrderDialogComponent', () => {
  let component: OrderDialogComponent;
  let fixture: ComponentFixture<OrderDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<OrderDialogComponent>>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      declarations: [ OrderDialogComponent ],
      imports: [ FormsModule ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: book }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the book', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Order Northern Lights');
    expect(text).toContain('By Lyra Silverstar');
  });

  it('submits the order with the quantity and closes when it is accepted', async () => {
    await fixture.whenStable();
    const quantity: HTMLInputElement = fixture.nativeElement.querySelector('input[name=quantity]');
    expect(quantity.value).toBe('1');
    quantity.value = '3';
    quantity.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('button').click();

    const request = httpTestingController.expectOne({ method: 'POST', url: '/orders' });
    expect(request.request.body).toEqual({ isbn: '1234567891', quantity: 3 });
    expect(dialogRef.close).not.toHaveBeenCalled();
    request.flush({});
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
