import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentService } from './attachment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attachment, AttachmentType } from './entities/attachment.entity';
import { Repository, Connection, QueryRunner, EntityManager } from 'typeorm';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock the external dependencies
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  extname: jest.fn().mockImplementation((filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
  dirname: jest.fn().mockImplementation((filename) => filename.split('/').slice(0, -1).join('/')),
  resolve: jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('AttachmentService', () => {
  let service: AttachmentService;
  let repository: Repository<Attachment>;
  let queryRunnerMock: any;

  // Sample data for tests
  const mockAttachment: Attachment = {
    id: 1,
    originalName: 'test.pdf',
    name: '1709555555555-mock-uuid.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    url: '/uploads/2025/03/1709555555555-mock-uuid.pdf',
    entityType: AttachmentType.DISCUSSION,
    entityId: 1,
    displayOrder: 0,
    isImage: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Attachment;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        update: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...data, id: 1 })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        {
          provide: getRepositoryToken(Attachment),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 1 })),
            findOne: jest.fn().mockResolvedValue(mockAttachment),
            find: jest.fn().mockResolvedValue([mockAttachment]),
            remove: jest.fn().mockResolvedValue(undefined),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
    repository = module.get<Repository<Attachment>>(getRepositoryToken(Attachment));

    // Mock Date.now for predictable filenames
    jest.spyOn(Date, 'now').mockImplementation(() => 1709555555555);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAttachment', () => {
    it('should create an attachment successfully', async () => {
      const result = await service.createAttachment(mockFile, AttachmentType.DISCUSSION, 1, 0);

      // Verify directory was checked
      expect(fs.existsSync).toHaveBeenCalled();

      // Verify file was written
      expect(fs.promises.writeFile).toHaveBeenCalled();

      // Verify entity was created with correct values
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          entityType: AttachmentType.DISCUSSION,
          entityId: 1,
          displayOrder: 0,
        }),
      );

      // Verify entity was saved
      expect(repository.save).toHaveBeenCalled();

      // Verify result
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          originalName: 'test.pdf',
        }),
      );
    });

    it('should use provided entity manager when available', async () => {
      const mockManager = {} as EntityManager;
      mockManager.save = jest.fn().mockResolvedValue(mockAttachment);

      await service.createAttachment(mockFile, AttachmentType.DISCUSSION, 1, 0, mockManager);

      // Verify manager was used instead of repository
      expect(mockManager.save).toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for oversized files', async () => {
      const oversizedFile = {
        ...mockFile,
        size: 5 * 1024 * 1024, // 5MB (exceeds 3MB limit)
      };

      await expect(service.createAttachment(oversizedFile, AttachmentType.DISCUSSION, 1, 0)).rejects.toThrow(
        BadRequestException,
      );

      // Verify no files were written
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'text/html', // Not in allowed types
      };

      await expect(service.createAttachment(invalidFile, AttachmentType.DISCUSSION, 1, 0)).rejects.toThrow(
        BadRequestException,
      );

      // Verify no files were written
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('createMultipleAttachments', () => {
    it('should create multiple attachments with correct display order', async () => {
      const mockFiles = [mockFile, { ...mockFile, originalname: 'test2.pdf' }];

      const result = await service.createMultipleAttachments(mockFiles, AttachmentType.DISCUSSION, 1);

      expect(result).toHaveLength(2);
      expect(result[0].displayOrder).toBe(0);
      expect(result[1].displayOrder).toBe(1);
    });

    it('should pass entity manager to createAttachment', async () => {
      const mockManager = {} as EntityManager;
      const createAttachmentSpy = jest.spyOn(service, 'createAttachment');

      await service.createMultipleAttachments([mockFile], AttachmentType.DISCUSSION, 1, mockManager);

      expect(createAttachmentSpy).toHaveBeenCalledWith(mockFile, AttachmentType.DISCUSSION, 1, 0, mockManager);
    });
  });

  describe('getAttachmentsByEntity', () => {
    it('should return attachments for a specific entity', async () => {
      const result = await service.getAttachmentsByEntity(AttachmentType.DISCUSSION, 1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { entityType: AttachmentType.DISCUSSION, entityId: 1 },
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual([mockAttachment]);
    });
  });

  describe('getAttachmentById', () => {
    it('should return an attachment by ID', async () => {
      const result = await service.getAttachmentById(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(mockAttachment);
    });

    it('should throw NotFoundException when attachment not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.getAttachmentById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete physical file and database record', async () => {
      await service.deleteAttachment(1);

      // Verify file was deleted
      expect(fs.promises.unlink).toHaveBeenCalled();

      // Verify record was removed
      expect(repository.remove).toHaveBeenCalledWith(mockAttachment);
    });

    it('should throw error when file deletion fails', async () => {
      const error = new Error('File deletion failed');
      (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.deleteAttachment(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteAttachmentsByEntity', () => {
    it('should delete all attachments for an entity', async () => {
      const deleteAttachmentSpy = jest.spyOn(service, 'deleteAttachment');

      await service.deleteAttachmentsByEntity(AttachmentType.DISCUSSION, 1);

      expect(deleteAttachmentSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('updateDisplayOrder', () => {
    it('should update display orders in a transaction', async () => {
      await service.updateDisplayOrder([1, 2], [2, 1]);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.update).toHaveBeenCalledTimes(2);
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when array lengths mismatch', async () => {
      await expect(service.updateDisplayOrder([1, 2, 3], [1, 2])).rejects.toThrow(BadRequestException);

      expect(queryRunnerMock.startTransaction).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      queryRunnerMock.manager.update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(service.updateDisplayOrder([1], [2])).rejects.toThrow(InternalServerErrorException);

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('private methods via interface testing', () => {
    describe('validateFile', () => {
      it('should accept valid files', () => {
        expect(() => {
          (service as any).validateFile(mockFile);
        }).not.toThrow();
      });

      it('should detect oversized files', () => {
        const oversizedFile = { ...mockFile, size: 10 * 1024 * 1024 };

        expect(() => {
          (service as any).validateFile(oversizedFile);
        }).toThrow(BadRequestException);
      });

      it('should detect invalid file types', () => {
        const invalidFile = { ...mockFile, mimetype: 'application/javascript' };

        expect(() => {
          (service as any).validateFile(invalidFile);
        }).toThrow(BadRequestException);
      });
    });

    describe('ensureDirectoryExists', () => {
      it('should create directory if it does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

        (service as any).ensureDirectoryExists('/test/dir');

        expect(fs.mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
      });

      it('should not create directory if it already exists', () => {
        (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

        (service as any).ensureDirectoryExists('/test/dir');

        expect(fs.mkdirSync).not.toHaveBeenCalled();
      });
    });
  });
});
