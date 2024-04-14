import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/core/entities/user.entity';
import { UsersService } from './users.service';
import { RateLimiterInterceptor } from 'src/interceptors/rate-limiter.interceptor';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOGGING',
        transport: Transport.TCP,
        options: { port: 3002 },
      },
    ]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersService, RateLimiterInterceptor],
  exports: [
    UsersService,
    RateLimiterInterceptor,
    TypeOrmModule.forFeature([User]),
    ClientsModule,
  ],
})
export class UsersModule {}
