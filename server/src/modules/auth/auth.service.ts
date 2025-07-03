import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { lastValueFrom } from 'rxjs';
import { UserRole } from '../../common/enums/user-role.enum';
import { ExternalApiConfig, JWTConfig } from '../../config';
import { AcademicService } from '../academic/academic.service';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: JWTConfig;
  private readonly apiConfig: ExternalApiConfig;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly academicService: AcademicService,
  ) {
    this.jwtConfig = this.configService.get<JWTConfig>('jwt')!;
    this.apiConfig = this.configService.get<ExternalApiConfig>('externalApi')!;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.getUserWithCredentials(loginDto.username);

    // If user exists and is not an external user, check password
    if (user && !user.isExternalUser) {
      if (!user.password) {
        throw new UnauthorizedException('Incorrect username or password');
      }
      const isPasswordValid = await this.userService.verifyPassword(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Incorrect username or password');
      }

      const tokens = await this.generateAuthTokens(user);
      return {
        user: UserResponseDto.fromEntity(user),
        ...tokens,
      };
    }

    // If is an external user or user not found, authenticate with external API
    try {
      const authenticatedUser = await this.authenticateWithExternalApi(loginDto);
      const tokens = await this.generateAuthTokens(authenticatedUser);

      return {
        user: UserResponseDto.fromEntity(authenticatedUser),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`External authentication failed: ${error.message}`);
      throw new UnauthorizedException('Incorrect username or password');
    }
  }

  private async authenticateWithExternalApi(loginDto: LoginDto): Promise<User> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<any>(
          `${this.apiConfig.baseUrl}/data/auth_mahasiswa`,
          new URLSearchParams({
            username: loginDto.username,
            password: loginDto.password,
          }).toString(),
          {
            auth: {
              username: this.apiConfig.username,
              password: this.apiConfig.password,
            },
            headers: {
              API_KEY_NAME: this.apiConfig.keyName,
              API_KEY_SECRET: this.apiConfig.keySecret,
            },
          },
        ),
      );

      if (!data || !data.data) {
        throw new UnauthorizedException('Authentication failed');
      }

      const studentData = data.data;

      // Find study program by code
      const studyProgram = await this.academicService.findStudyProgramByCode(studentData.kode_program_studi);

      if (!studyProgram) {
        this.logger.warn(
          `Study program with code ${studentData.kode_program_studi} not found for student ${studentData.nim}`,
        );
      }

      // Create or update user with external data
      return await this.userService.createExternalUser({
        username: studentData.nim,
        fullName: studentData.nama,
        gender: studentData.jeniskelamin,
        batchYear: studentData.angkatan,
        educationLevel: studentData.program_pendidikan,
        email: studentData.email,
        phone: studentData.hp,
        studyProgramId: studyProgram?.id || null,
        role: UserRole.STUDENT,
      });
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        this.logger.error(
          `External API DNS resolution failed for ${this.apiConfig.baseUrl}: ${error.message}`,
          error.stack,
        );
        throw new UnauthorizedException(
          'Authentication service is currently unavailable. Please try again later or contact support.',
        );
      }

      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`External API connection refused: ${error.message}`, error.stack);
        throw new UnauthorizedException('Authentication service is not responding. Please try again later.');
      }

      if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
        this.logger.error(`External API timeout: ${error.message}`, error.stack);
        throw new UnauthorizedException('Authentication service is taking too long to respond. Please try again.');
      }

      if (error.code === 'ECONNRESET') {
        this.logger.error(`External API connection reset: ${error.message}`, error.stack);
        throw new UnauthorizedException('Connection to authentication service was interrupted. Please try again.');
      }

      this.logger.error(`External API authentication error: ${error.message}`, error.stack);
      throw new UnauthorizedException('External authentication failed');
    }
  }

  async refreshToken(userId: number) {
    try {
      const user = await this.userService.getUserEntity(userId);
      return this.generateAuthTokens(user);
    } catch (error) {
      this.logger.warn(`Failed token refresh attempt for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async generateAuthTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.accessTokenSecret,
        expiresIn: this.jwtConfig.accessTokenExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.refreshTokenSecret,
        expiresIn: this.jwtConfig.refreshTokenExpires,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
