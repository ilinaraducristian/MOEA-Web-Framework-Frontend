import { TestBed } from '@angular/core/testing';

import { SolverService } from './solver.service';

describe('SolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SolverService = TestBed.get(SolverService);
    expect(service).toBeTruthy();
  });
});
