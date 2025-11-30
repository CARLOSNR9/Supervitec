import { Test, TestingModule } from '@nestjs/testing';
import { OrdenTrabajoService } from './orden-trabajo.service';

describe('OrdenTrabajoService', () => {
  let service: OrdenTrabajoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdenTrabajoService],
    }).compile();

    service = module.get<OrdenTrabajoService>(OrdenTrabajoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
