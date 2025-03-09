import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { FileModule } from 'src/core/file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    FileModule,
  ],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
