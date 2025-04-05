import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../../core/file/file.module';
import { AttachmentService } from './attachment.service';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment]), FileModule],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
