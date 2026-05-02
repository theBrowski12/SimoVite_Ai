import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  let component: LanguageSwitcher;
  let fixture: ComponentFixture<LanguageSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LanguageSwitcher],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
