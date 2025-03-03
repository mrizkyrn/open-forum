import * as fs from 'fs';
import * as path from 'path';
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, AttachmentType } from './entities/attachment.entity';

@Injectable()
export class AttachmentService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.uploadDir);
  }

  async createAttachment(
    file: Express.Multer.File,
    entityType: AttachmentType,
    entityId: number,
    displayOrder: number,
    manager?: EntityManager,
  ): Promise<Attachment> {
    try {
      // Validate file
      this.validateFile(file);

      // Create directory path by date (year/month)
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const dirPath = path.join(this.uploadDir, year, month);

      // Ensure directory exists
      this.ensureDirectoryExists(dirPath);

      // Generate unique filename
      const fileExt = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${uuidv4()}${fileExt}`;
      const filePath = path.join(dirPath, uniqueFilename);
      const relativePath = path.join(year, month, uniqueFilename).replace(/\\/g, '/');

      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);

      // Determine if file is an image
      const isImage = file.mimetype.startsWith('image/');

      // Create attachment record
      const attachment = this.attachmentRepository.create({
        originalName: file.originalname,
        name: uniqueFilename,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${relativePath}`,
        entityType,
        entityId,
        displayOrder,
        isImage,
      });

      if (manager) {
        return manager.save(Attachment, attachment);
      } else {
        return this.attachmentRepository.save(attachment);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error creating attachment:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async createMultipleAttachments(
    files: Express.Multer.File[],
    entityType: AttachmentType,
    entityId: number,
    manager?: EntityManager,
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const attachment = await this.createAttachment(files[i], entityType, entityId, i, manager);
      attachments.push(attachment);
    }

    return attachments;
  }

  async getAttachmentsByEntity(entityType: AttachmentType, entityId: number): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAttachmentById(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  async deleteAttachment(id: number, manager?: EntityManager): Promise<void> {
    const attachment = await this.getAttachmentById(id);

    try {
      const filePath = path.join(this.uploadDir, attachment.url.replace('/uploads/', ''));
      await fs.promises.unlink(filePath);

      if (manager) {
        await manager.remove(Attachment, attachment);
      } else {
        await this.attachmentRepository.remove(attachment);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw new InternalServerErrorException('Failed to delete attachment');
    }
  }

  async deleteAttachmentsByEntity(entityType: AttachmentType, entityId: number, manager?: EntityManager): Promise<void> {
    const attachments = await this.getAttachmentsByEntity(entityType, entityId);

    for (const attachment of attachments) {
      await this.deleteAttachment(attachment.id, manager);
    }
  }

  async updateDisplayOrder(attachmentIds: number[], orders: number[]): Promise<void> {
    if (attachmentIds.length !== orders.length) {
      throw new BadRequestException('The number of IDs must match the number of orders');
    }

    const queryRunner = this.attachmentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < attachmentIds.length; i++) {
        await queryRunner.manager.update(Attachment, { id: attachmentIds[i] }, { displayOrder: orders[i] });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to update attachment display orders');
    } finally {
      await queryRunner.release();
    }
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`);
    }

    // Check file type
    const allowedMimeTypes = [
      // Images
      'image/jpg',
      'image/jpeg',
      'image/png',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }
  }
}
