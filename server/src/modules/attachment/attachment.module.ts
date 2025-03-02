import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
