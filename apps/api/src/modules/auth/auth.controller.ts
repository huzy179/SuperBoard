import { BadRequestException, Body, Controller, Get, Patch, Post } from '@nestjs/common';
import type {
  AuthResponseDTO,
  AuthUserDTO,
  LoginRequestDTO,
  MeResponseDTO,
  UpdateProfileRequestDTO,
} from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: Partial<LoginRequestDTO>): Promise<AuthResponseDTO> {
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const payload = await this.authService.login(email, password);
    return apiSuccess(payload);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUserDTO): MeResponseDTO {
    return apiSuccess({ user });
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUserDTO,
    @Body() body: UpdateProfileRequestDTO,
  ): Promise<MeResponseDTO> {
    const updatedUser = await this.authService.updateProfile(user.id, body);
    return apiSuccess({ user: updatedUser });
  }
}
