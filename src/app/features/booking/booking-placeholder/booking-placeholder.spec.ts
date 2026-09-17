import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { BookingPlaceholder } from './booking-placeholder';

describe('BookingPlaceholder', () => {
  it('reads the kind/id from the route (proves BookingHandoffService.proceed() lands somewhere real)', () => {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [BookingPlaceholder],
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ kind: 'treatment', id: '1' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(BookingPlaceholder);
    fixture.detectChanges();

    expect(fixture.componentInstance.kind()).toBe('treatment');
    expect(fixture.componentInstance.id()).toBe('1');
  });

  it('"Back to discovery" navigates to /discover', () => {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [BookingPlaceholder],
      providers: [
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ kind: 'treatment', id: '1' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(BookingPlaceholder);
    fixture.detectChanges();

    fixture.componentInstance.backToDiscovery();

    expect(navigate).toHaveBeenCalledWith(['/discover']);
  });
});
