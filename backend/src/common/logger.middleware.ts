import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const time = Date.now() - start;
      this.logger.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${time}ms)`);
    });
    next();
  }
}
