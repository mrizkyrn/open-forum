import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticController } from './analytic.controller';
import { AnalyticService } from './analytic.service';
import { UserActivity } from './entities/user-activity.entity';
import { AnalyticEventService } from './analytic-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivity])],
  controllers: [AnalyticController],
  providers: [AnalyticService, AnalyticEventService],
  exports: [AnalyticService],
})
export class AnalyticModule {}
