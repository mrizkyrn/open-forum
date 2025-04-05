import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { Faculty } from './entity/faculty.entity';
import { StudyProgram } from './entity/study-program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty, StudyProgram]), HttpModule],
  controllers: [AcademicController],
  providers: [AcademicService],
  exports: [AcademicService],
})
export class AcademicModule {}
