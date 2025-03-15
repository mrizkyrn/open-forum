import * as fs from 'fs';
import * as path from 'path';
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, AttachmentType } from './entities/attachment.entity';
import { FileService, FileType } from 'src/core/file/file.service';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly fileService: FileService,
  ) {}

  async createAttachment(
    file: Express.Multer.File,
    entityType: AttachmentType,
    entityId: number,
    displayOrder: number,
    manager?: EntityManager,
  ): Promise<Attachment> {
    try {
      const fileType = this.mapAttachmentTypeToFileType(entityType);
      const fileUrl = await this.fileService.uploadFile(file, fileType);
      const filename = fileUrl.split('/').pop();
      const isImage = file.mimetype.startsWith('image/');

      const attachment = this.attachmentRepository.create({
        originalName: file.originalname,
        name: filename,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
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
      // Use FileService to delete the file
      await this.fileService.deleteFile(attachment.url);

      // Delete database record
      if (manager) {
        await manager.remove(Attachment, attachment);
      } else {
        await this.attachmentRepository.softDelete(attachment.id);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw new InternalServerErrorException('Failed to delete attachment');
    }
  }

  async deleteAttachmentsByEntity(
    entityType: AttachmentType,
    entityId: number,
    manager?: EntityManager,
  ): Promise<void> {
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

  private mapAttachmentTypeToFileType(attachmentType: AttachmentType): FileType {
    switch (attachmentType) {
      case AttachmentType.DISCUSSION:
        return FileType.DISCUSSION_ATTACHMENT;
      case AttachmentType.COMMENT:
        return FileType.COMMENT_ATTACHMENT;
      default:
        return FileType.DISCUSSION_ATTACHMENT; // Default fallback
    }
  }
}
