import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CarbonCreditsModule } from './carbon-credits/carbon-credits.module';
import { TokensModule } from './tokens/tokens.module';
import { ProjectsModule } from './projects/projects.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { TransactionHistoryModule } from './transaction-history/transaction-history.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      // logging: process.env.NODE_ENV === 'development',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),

    // Feature modules
    CommonModule,
    AuthModule,
    BlockchainModule,
    CarbonCreditsModule,
    TokensModule,
    ProjectsModule,
    TransactionHistoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
