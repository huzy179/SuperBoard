import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type LoginBody = {
  email?: string;
  password?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBody) {
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    return this.authService.login(email, password);
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const user = await this.authService.getMeFromToken(authorization);
    return { user };
  }
}
