import { Test, TestingModule } from '@nestjs/testing';
import { OrdenTrabajoController } from './orden-trabajo.controller';

describe('OrdenTrabajoController', () => {
  let controller: OrdenTrabajoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdenTrabajoController],
    }).compile();

    controller = module.get<OrdenTrabajoController>(OrdenTrabajoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
