import { TestBed } from '@angular/core/testing';

import { PresenseService } from './presense.service';

describe('PresenseService', () => {
  let service: PresenseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresenseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
