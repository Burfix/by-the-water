import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../common/enums/role.enum';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ tokens: TokenPair; user: UserSummary }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });

    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return { tokens: this.issueTokens(user), user: this.toSummary(user) };
  }

  async register(dto: RegisterDto): Promise<{ tokens: TokenPair; user: UserSummary }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepo.create({ ...dto, email: dto.email.toLowerCase() });
    await this.userRepo.save(user);
    this.logger.log(`New user registered: ${user.email} (${user.role})`);

    return { tokens: this.issueTokens(user), user: this.toSummary(user) };
  }

  async refreshTokens(refreshToken: string): Promise<{ tokens: TokenPair; user: UserSummary }> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or account deactivated');
    }

    return { tokens: this.issueTokens(user), user: this.toSummary(user) };
  }

  async getProfile(userId: string): Promise<UserSummary> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toSummary(user);
  }

  private issueTokens(user: User): TokenPair {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private toSummary(user: User): UserSummary {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}



