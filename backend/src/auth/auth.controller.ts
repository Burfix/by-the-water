import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get isSecure(): boolean {
    return this.config.get<string>('app.nodeEnv') === 'production';
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const secure = this.isSecure;
    const base = { httpOnly: true, secure, sameSite: secure ? ('none' as const) : ('lax' as const) };

    res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: 15 * 60 * 1000 }); // 15 min
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...base,
      path: '/api/v1/auth/refresh', // scope refresh cookie to refresh endpoint only
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearTokenCookies(res: Response): void {
    const secure = this.isSecure;
    const base = { httpOnly: true, secure, sameSite: secure ? ('none' as const) : ('lax' as const) };
    res.cookie(ACCESS_COOKIE, '', { ...base, maxAge: 0 });
    res.cookie(REFRESH_COOKIE, '', { ...base, path: '/api/v1/auth/refresh', maxAge: 0 });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — sets httpOnly access_token + refresh_token cookies' })
  @ApiResponse({ status: 200, description: 'Authenticated — user info returned, tokens in cookies' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.login(dto);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered — tokens in cookies' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.register(dto);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  /**
   * Refresh — reads refresh_token cookie, rotates both tokens.
   * Marked @Public() so JwtAuthGuard does NOT block an expired access token.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate tokens using refresh_token cookie' })
  @ApiResponse({ status: 200, description: 'New tokens issued in cookies' })
  @ApiResponse({ status: 401, description: 'Refresh token missing or invalid' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const { tokens, user } = await this.authService.refreshTokens(refreshToken);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — clears auth cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearTokenCookies(res);
    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}



