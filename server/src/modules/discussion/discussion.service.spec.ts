import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionService } from './discussion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Connection, QueryRunner, EntityManager } from 'typeorm';
import { Discussion } from './entities/discussion.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { Attachment, AttachmentType } from '../attachment/entities/attachment.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { User } from '../user/entities/user.entity';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';

// // Mock fs and path
// jest.mock('fs', () => ({
//   promises: {
//     unlink: jest.fn().mockResolvedValue(undefined),
//     writeFile: jest.fn().mockResolvedValue(undefined),
//   },
//   existsSync: jest.fn().mockReturnValue(true),
// }));

// jest.mock('path', () => ({
//   join: jest.fn().mockImplementation((...args) => args.join('/')),
//   dirname: jest.fn().mockImplementation(path => {
//     // Simple implementation that works for test cases
//     const parts = path.split('/');
//     parts.pop(); // Remove filename
//     return parts.join('/') || '.';
//   }),
//   extname: jest.fn().mockImplementation(filename => {
//     // Extract extension
//     const parts = filename.split('.');
//     return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
//   }),
//   basename: jest.fn().mockImplementation((path, ext) => {
//     // Extract filename
//     const filename = path.split('/').pop() || '';
//     if (ext && filename.endsWith(ext)) {
//       return filename.slice(0, -ext.length);
//     }
//     return filename;
//   }),
//   relative: jest.fn().mockImplementation((from, to) => {
//     // Simple implementation for testing
//     return to.replace(from, '').replace(/^\//, '');
//   }),
//   resolve: jest.fn().mockImplementation((...args) => args.join('/')),
// }));

describe('DiscussionService', () => {
  let service: DiscussionService;
  let discussionRepository: Repository<Discussion>;
  let attachmentService: AttachmentService;
  let queryRunnerMock: any;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  } as User;

  const mockDiscussion: Discussion = {
    id: 1,
    content: 'Test discussion content',
    isAnonymous: false,
    authorId: mockUser.id,
    author: mockUser,
    commentCount: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    tags: ['test', 'unit-testing'],
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [],
    isDeleted: false,
  } as Discussion;

  const mockAttachment: Attachment = {
    id: 1,
    originalName: 'test-file.pdf',
    name: '1740933196162-uuid.pdf',
    mimeType: 'application/pdf',
    size: 123456,
    url: '/uploads/2025/03/1740933196162-uuid.pdf',
    entityType: AttachmentType.DISCUSSION,
    entityId: 1,
    displayOrder: 0,
    isImage: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Attachment;

  // Mock file object for testing
  const mockFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'test-file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content'),
    size: 123456,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    // Create mock query runner for transaction testing
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn().mockImplementation((entity, data) => Promise.resolve({ ...data, id: 1 })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionService,
        {
          provide: getRepositoryToken(Discussion),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockResolvedValue(mockDiscussion),
            findOne: jest.fn().mockResolvedValue(mockDiscussion),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
              },
            },
          },
        },
        {
          provide: AttachmentService,
          useValue: {
            createMultipleAttachments: jest.fn().mockResolvedValue([mockAttachment]),
            getAttachmentsByEntity: jest.fn().mockResolvedValue([mockAttachment]),
            cleanupFiles: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DiscussionService>(DiscussionService);
    discussionRepository = module.get<Repository<Discussion>>(getRepositoryToken(Discussion));
    attachmentService = module.get<AttachmentService>(AttachmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDiscussionDto: CreateDiscussionDto = {
      content: 'Test discussion content',
      isAnonymous: false,
      tags: ['test', 'unit-testing'],
    };

    it('should create a discussion without files', async () => {
      const findByIdSpy = jest.spyOn(service, 'findById').mockResolvedValue(mockDiscussion);

      const result = await service.create(createDiscussionDto, mockUser);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(queryRunnerMock.manager.save).toHaveBeenCalled();
      expect(findByIdSpy).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDiscussion);
    });

    // it('should create a discussion with files', async () => {
    //   const findByIdSpy = jest.spyOn(service, 'findById').mockResolvedValue({
    //     ...mockDiscussion,
    //     attachments: [mockAttachment],
    //   });

    //   const result = await service.create(createDiscussionDto, mockUser, [mockFile]);

    //   expect(attachmentService.createMultipleAttachments).toHaveBeenCalledWith(
    //     [mockFile],
    //     AttachmentType.DISCUSSION,
    //     1,
    //     queryRunnerMock.manager,
    //   );
    //   expect(findByIdSpy).toHaveBeenCalledWith(1);
    //   expect(result.attachments).toHaveLength(1);
    //   expect(result.attachments[0]).toEqual(mockAttachment);
    // });

    it('should throw BadRequestException when content is empty', async () => {
      await expect(service.create({ ...createDiscussionDto, content: '' }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    // it('should rollback transaction and cleanup files on error', async () => {
    //   const error = new Error('Test error');
    //   queryRunnerMock.manager.save.mockRejectedValueOnce(error);

    //   const cleanupFilesSpy = jest.spyOn(service as any, 'cleanupFiles');

    //   await expect(service.create(createDiscussionDto, mockUser)).rejects.toThrow(error);

    //   expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    //   expect(cleanupFilesSpy).toHaveBeenCalled();
    // });
  });

  describe('findById', () => {
    it('should find a discussion by id and load attachments', async () => {
      const result = await service.findById(1);

      expect(discussionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['author'],
      });
      expect(attachmentService.getAttachmentsByEntity).toHaveBeenCalledWith(AttachmentType.DISCUSSION, 1);
      expect(result).toEqual({
        ...mockDiscussion,
        attachments: [mockAttachment],
      });
    });

    it('should throw NotFoundException when discussion not found', async () => {
      jest.spyOn(discussionRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('formatDiscussionResponse', () => {
    let testDiscussion: Discussion;

    const createDiscussionWithDates = (baseDiscussion: any): Discussion => {
      return {
        ...baseDiscussion,
        createdAt: new Date(baseDiscussion.createdAt),
        updatedAt: new Date(baseDiscussion.updatedAt),
        author: baseDiscussion.author
          ? {
              ...baseDiscussion.author,
              createdAt: new Date(baseDiscussion.author.createdAt),
              updatedAt: new Date(baseDiscussion.author.updatedAt),
            }
          : null,
      };
    };

    beforeEach(() => {
      testDiscussion = createDiscussionWithDates({
        ...mockDiscussion,
        attachments: [],
      });
    });

    it('should format non-anonymous discussion', () => {
      const result = service.formatDiscussionResponse(testDiscussion);

      expect(result).toEqual({
        id: testDiscussion.id,
        content: testDiscussion.content,
        isAnonymous: testDiscussion.isAnonymous,
        tags: testDiscussion.tags,
        createdAt: testDiscussion.createdAt,
        updatedAt: testDiscussion.updatedAt,
        author: {
          id: testDiscussion.author.id,
          username: testDiscussion.author.username,
          fullName: testDiscussion.author.fullName,
          role: testDiscussion.author.role,
          createdAt: testDiscussion.author.createdAt,
          updatedAt: testDiscussion.author.updatedAt,
        },
        attachments: [],
        commentCount: testDiscussion.commentCount,
        upvoteCount: testDiscussion.upvoteCount,
        downvoteCount: testDiscussion.downvoteCount,
      });
    });

    it('should format anonymous discussion', () => {
      const anonymousDiscussion = {
        ...testDiscussion,
        isAnonymous: true,
      };

      const result = service.formatDiscussionResponse(anonymousDiscussion);

      expect(result.author).toBeNull();
    });

    it('should show "You - Anonymous" for own anonymous posts', () => {
      const anonymousDiscussion = {
        ...testDiscussion,
        isAnonymous: true,
      };

      const result = service.formatDiscussionResponse(anonymousDiscussion, mockUser);

      expect(result.author).toEqual({
        id: testDiscussion.author.id,
        username: '(You - Anonymous)',
        fullName: '(You - Anonymous)',
        role: testDiscussion.author.role,
        createdAt: testDiscussion.author.createdAt,
        updatedAt: testDiscussion.author.updatedAt,
      });
    });

    it('should sort attachments by display order', () => {
      const discussionWithAttachments = {
        ...testDiscussion,
        attachments: [
          { ...mockAttachment, id: 1, displayOrder: 2 },
          { ...mockAttachment, id: 2, displayOrder: 0 },
          { ...mockAttachment, id: 3, displayOrder: 1 },
        ],
      };

      const result = service.formatDiscussionResponse(discussionWithAttachments);

      expect(result.attachments[0].id).toBe(2); // displayOrder 0
      expect(result.attachments[1].id).toBe(3); // displayOrder 1
      expect(result.attachments[2].id).toBe(1); // displayOrder 2
    });
  });

  // describe('cleanupFiles', () => {
  //   it('should delete files that exist', async () => {
  //     const filePaths = ['/path/to/file1.pdf', '/path/to/file2.pdf'];

  //     await (service as any).cleanupFiles(filePaths);

  //     expect(fs.existsSync).toHaveBeenCalledTimes(2);
  //     expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
  //   });

  //   it('should handle errors when deleting files', async () => {
  //     const filePaths = ['/path/to/file.pdf'];
  //     const mockError = new Error('Failed to delete');

  //     (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(mockError);

  //     // Should not throw
  //     await expect((service as any).cleanupFiles(filePaths)).resolves.not.toThrow();
  //   });
  // });
});
