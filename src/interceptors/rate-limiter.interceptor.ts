import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/core/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RateLimiterInterceptor implements NestInterceptor {
  constructor(
    @InjectRedis() private readonly redisService: Redis,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const accessKey = request.headers['x-access-key'];
    if (accessKey == undefined) {
      throw new UnauthorizedException({
        message: 'access-key missing, not allowed',
      });
    }

    const user = await this.userRepository.findOneBy({ accessKey: accessKey });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid Access-key',
      });
    }

    if (!user.isKeyActive) {
      throw new HttpException('Access-key inactive', HttpStatus.FORBIDDEN);
    }

    if (user.keyExpiration && new Date() > user.keyExpiration) {
      throw new HttpException('Access key expired', HttpStatus.FORBIDDEN);
    }
    const currentCountStr = await this.redisService.get(accessKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    // console.log('Allowed', user.rateLimit);
    // console.log('Logged ', currentCount);
    if (currentCount >= user.rateLimit) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.redisService.incr(accessKey);
    if (currentCount === 0) {
      await this.redisService.expire(accessKey, 60);
    }
    request.user = user;
    request.user.rateCount = currentCount + 1;
    return next.handle();
  }
}
