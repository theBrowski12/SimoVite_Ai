import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProductDetailsComponent } from './admin-product-details';
describe('AdminProductDetails', () => {
  let component: AdminProductDetailsComponent;
  let fixture: ComponentFixture<AdminProductDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminProductDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
