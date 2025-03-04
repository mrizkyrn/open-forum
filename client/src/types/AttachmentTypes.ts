export enum AttachmentType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
}

export interface Attachment {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: AttachmentType;
  entityId: number;
  isImage: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
