import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const token = auth.split(' ')[1];
      request.user = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}