import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/** Extract JWT from httpOnly cookie first, fall back to Authorization header */
function cookieOrBearer(req: Request): string | null {
  const fromCookie = req?.cookies?.['access_token'];
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: cookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or account deactivated');
    }

    return user;
  }
}

