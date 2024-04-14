import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from 'src/core/dtos/user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RateLimiterInterceptor } from 'src/interceptors/rate-limiter.interceptor';
import { UsersService } from 'src/services/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('email/:email')
  findUsersByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  @UseGuards(AuthGuard)
  @Patch()
  @UsePipes(ValidationPipe)
  updateUsers(@Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete('email/:email')
  deleteUsersByEmail(@Param('email') email: string) {
    return this.userService.deleteUserByEmail(email);
  }

  @UseGuards(AuthGuard)
  @Post('create')
  @UsePipes(ValidationPipe)
  createUsers(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get('/settings')
  @UseInterceptors(RateLimiterInterceptor)
  getUserSettings(@Req() request: Request) {
    if (request['user']) {
      delete request['user']['id'];
      delete request['user']['accessKey'];
      return request['user'];
    }
    throw new UnauthorizedException({ message: 'not allowed' });
  }
}
