import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectChannelComponent } from './select-channel.component';

describe('SelectChannelComponent', () => {
  let component: SelectChannelComponent;
  let fixture: ComponentFixture<SelectChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
