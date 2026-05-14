import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppLogger } from './logging/app-logger.service';
import { SupabaseService } from './supabase/supabase.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  providers: [JwtAuthGuard, AppLogger, SupabaseService],
  exports: [ConfigModule, JwtModule, JwtAuthGuard, AppLogger, SupabaseService],
})
export class CommonModule {}
