import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialDelivery } from './special-delivery';

describe('SpecialDelivery', () => {
  let component: SpecialDelivery;
  let fixture: ComponentFixture<SpecialDelivery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpecialDelivery],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialDelivery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
