import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PREMIUM_KEY } from '../decorators/premium.decorator';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPremium = this.reflector.getAllAndOverride<boolean>(IS_PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPremium) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.subscriptionTier !== 'CONNOISSEUR') {
      throw new ForbiddenException('Premium subscription required');
    }

    return true;
  }
}
