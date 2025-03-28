import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../../core/redis/redis.module';
import { AnalyticController } from './analytic.controller';
import { AnalyticService } from './analytic.service';
import { UserActivity } from './entities/user-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivity]), RedisModule],
  controllers: [AnalyticController],
  providers: [AnalyticService],
  exports: [AnalyticService],
})
export class AnalyticModule {}
