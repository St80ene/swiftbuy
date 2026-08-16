import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Tell passport to extract the token from the "Authorization: Bearer <TOKEN>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // Must match the secret in AuthModule!
    });
  }

  // 2. This method triggers automatically if the token signature is valid
  validate(payload: any) {
    // What you return here becomes "req.user" in your controller!
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
