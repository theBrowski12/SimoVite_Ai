import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourierAccount } from './courier-account';

describe('CourierAccount', () => {
  let component: CourierAccount;
  let fixture: ComponentFixture<CourierAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourierAccount],
    }).compileComponents();

    fixture = TestBed.createComponent(CourierAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
