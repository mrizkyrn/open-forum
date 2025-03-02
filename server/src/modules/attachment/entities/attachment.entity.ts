import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum AttachmentType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'integer' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: AttachmentType,
  })
  @Index()
  entityType: AttachmentType;

  @Column({ name: 'entity_id' })
  @Index()
  entityId: number;

  @Column({ name: 'is_image', type: 'boolean', default: false })
  isImage: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;
}
