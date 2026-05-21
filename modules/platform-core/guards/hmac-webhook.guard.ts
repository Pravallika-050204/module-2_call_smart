import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HmacWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET!;
    const body = JSON.stringify(request.body);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== `sha256=${expected}`) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
