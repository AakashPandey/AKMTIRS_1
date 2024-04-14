import { InjectRedis } from '@nestjs-modules/ioredis';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/core';
import Redis from 'ioredis';
import { CreateUserDto, UpdateUserDto } from 'src/core/dtos/user.dto';
import { QueryFailedError, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(
    @InjectRedis() private readonly redisService: Redis,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject('LOGGING') private readonly loggingClient: ClientProxy,
  ) {}

  addSeconds(date: Date, seconds: number) {
    return new Date(date.getTime() + seconds * 1000);
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const newUser = this.userRepository.create(createUserDto);
      newUser.keyExpiration = this.addSeconds(
        new Date(),
        createUserDto.keyExpirationSeconds,
      );
      this.loggingClient.emit(
        'm1_event',
        `ADMIN-KMS(M1) - SIGNUP: ${newUser.email}`,
      );
      return await this.userRepository.save(newUser);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        console.log(err);
        if (err['code'] === '23505') {
          this.loggingClient.emit(
            'm1_event',
            `ADMIN-KMS(M1) - DUPLICATE EMAIL FOR SIGNUP: ${createUserDto.email}`,
          );
          throw new BadRequestException({ message: 'email already exists' });
        }
      }
    }

    return;
  }

  findUserByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async deleteUserByEmail(email: string) {
    const r = await this.userRepository.delete({ email });
    if (r.affected == 1) {
      this.loggingClient.emit('m1_event', `ADMIN-KMS(M1) - DELETED: ${email}`);
      return { success: true, HttpCode: 200 };
    } else {
      throw new BadRequestException();
    }
  }

  async updateUser(userUpdateDto: UpdateUserDto) {
    const updatedUser = this.userRepository.create(userUpdateDto);
    delete updatedUser.accessKey;
    updatedUser.keyExpiration = this.addSeconds(
      new Date(),
      userUpdateDto.keyExpirationSeconds,
    );

    const r = await this.userRepository.update(
      { email: userUpdateDto.email },
      updatedUser,
    );

    if (userUpdateDto.resetRateLimit) {
      const user = await this.findUserByEmail(userUpdateDto.email);
      this.loggingClient.emit(
        'm1_event',
        `ADMIN-KMS(M1) - RATE-LIMIT RESET: ${userUpdateDto.email}`,
      );
      await this.redisService.del(user.accessKey);
    }
    if (r.affected == 1) {
      this.loggingClient.emit(
        'm1_event',
        `ADMIN-KMS(M1) - UPDATED: ${userUpdateDto.email}`,
      );
      return { success: true, HttpCode: 200 };
    } else {
      throw new BadRequestException();
    }
  }
}
