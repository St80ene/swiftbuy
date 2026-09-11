import { Injectable } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Injectable()
export class AppService {
  @Public()
  getHello(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'SwiftBuy API is running',
    };
  }
}
