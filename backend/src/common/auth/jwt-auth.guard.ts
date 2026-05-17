import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from './auth-user.interface';

interface JwtPayload {
  sub: string;
  walletAddress: string;
  accountType: 'worker' | 'manager';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });

      if (!this.isValidPayload(payload)) {
        throw new UnauthorizedException('인증 토큰의 사용자 정보가 올바르지 않습니다');
      }

      request.user = {
        id: payload.sub,
        walletAddress: payload.walletAddress,
        accountType: payload.accountType,
      };

      return true;
    } catch {
      throw new UnauthorizedException('인증 토큰이 유효하지 않습니다');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isValidPayload(payload: Partial<JwtPayload>): payload is JwtPayload {
    return (
      typeof payload.sub === 'string' &&
      payload.sub.length > 0 &&
      typeof payload.walletAddress === 'string' &&
      payload.walletAddress.length > 0 &&
      (payload.accountType === 'worker' || payload.accountType === 'manager')
    );
  }
}
