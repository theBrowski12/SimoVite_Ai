import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourierLayout } from './courier-layout';

describe('CourierLayout', () => {
  let component: CourierLayout;
  let fixture: ComponentFixture<CourierLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourierLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(CourierLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
