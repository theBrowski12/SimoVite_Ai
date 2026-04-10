import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientStores } from './client-stores';

describe('ClientStores', () => {
  let component: ClientStores;
  let fixture: ComponentFixture<ClientStores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientStores],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientStores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
