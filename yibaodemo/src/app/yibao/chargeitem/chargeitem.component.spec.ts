import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeitemComponent } from '@app/yibao/chargeitem/chargeitem.component';

describe('ChargeitemComponent', () => {
  let component: ChargeitemComponent;
  let fixture: ComponentFixture<ChargeitemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChargeitemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargeitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
