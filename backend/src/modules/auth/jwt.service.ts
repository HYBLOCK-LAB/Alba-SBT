import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthenticatedUser } from './auth.types.js';

type JwtHeader = {
  alg?: string;
  typ?: string;
};

type JwtPayload = {
  sub?: unknown;
  walletAddress?: unknown;
  accountType?: unknown;
  iat?: unknown;
  exp?: unknown;
};

@Injectable()
export class JwtService {
  verify(token: string): AuthenticatedUser {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    const [headerPart, payloadPart, signaturePart] = token.split('.');

    if (!headerPart || !payloadPart || !signaturePart) {
      throw new UnauthorizedException('Invalid JWT format');
    }

    const header = this.decodeJson<JwtHeader>(headerPart);

    if (header.alg !== 'HS256') {
      throw new UnauthorizedException('Unsupported JWT algorithm');
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest('base64url');

    if (!this.safeEquals(signaturePart, expectedSignature)) {
      throw new UnauthorizedException('Invalid JWT signature');
    }

    const payload = this.decodeJson<JwtPayload>(payloadPart);
    const user = this.toAuthenticatedUser(payload);

    if (user.exp && Math.floor(Date.now() / 1000) >= user.exp) {
      throw new UnauthorizedException('JWT has expired');
    }

    return user;
  }

  private decodeJson<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }
  }

  private toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.walletAddress !== 'string' ||
      (payload.accountType !== 'worker' && payload.accountType !== 'manager')
    ) {
      throw new UnauthorizedException('JWT payload is missing required claims');
    }

    return {
      sub: payload.sub,
      walletAddress: payload.walletAddress,
      accountType: payload.accountType,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined
    };
  }

  private safeEquals(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }
}
