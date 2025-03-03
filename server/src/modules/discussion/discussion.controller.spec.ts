import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { User } from '../user/entities/user.entity';
import { Discussion } from './entities/discussion.entity';
import { Attachment, AttachmentType } from '../attachment/entities/attachment.entity';
import { DiscussionResponseDto } from './dto/discussion-response.dto';

describe('DiscussionController', () => {
  let controller: DiscussionController;
  let service: DiscussionService;

  // Mock data
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    password: 'hashedpassword',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

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
    attachments: [mockAttachment],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Discussion;

  const mockDiscussionResponse: DiscussionResponseDto = {
    id: 1,
    content: 'Test discussion content',
    isAnonymous: false,
    tags: ['test', 'unit-testing'],
    author: {
      id: mockUser.id,
      username: mockUser.username,
      fullName: mockUser.fullName,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    },
    attachments: [mockAttachment],
    commentCount: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    createdAt: mockDiscussion.createdAt,
    updatedAt: mockDiscussion.updatedAt,
    isBookmarked: false,
  };

  const createDiscussionDto: CreateDiscussionDto = {
    content: 'Test discussion content',
    isAnonymous: false,
    tags: ['test', 'unit-testing'],
  };

  // Mock file for file upload testing
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscussionController],
      providers: [
        {
          provide: DiscussionService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDiscussion),
            formatDiscussionResponse: jest.fn().mockReturnValue(mockDiscussionResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<DiscussionController>(DiscussionController);
    service = module.get<DiscussionService>(DiscussionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDiscussion', () => {
    it('should create a discussion with attachments', async () => {
      const files = [mockFile];

      const result = await controller.createDiscussion(createDiscussionDto, mockUser, files);

      expect(service.create).toHaveBeenCalledWith(createDiscussionDto, mockUser, files);
      expect(service.formatDiscussionResponse).toHaveBeenCalledWith(mockDiscussion, mockUser);
      expect(result).toEqual(mockDiscussionResponse);
    });

    it('should create a discussion without attachments', async () => {
      const result = await controller.createDiscussion(createDiscussionDto, mockUser, []);

      expect(service.create).toHaveBeenCalledWith(createDiscussionDto, mockUser, []);
      expect(service.formatDiscussionResponse).toHaveBeenCalledWith(mockDiscussion, mockUser);
      expect(result).toEqual(mockDiscussionResponse);
    });

    it('should handle undefined files array', async () => {
      // This tests the case where no files are uploaded and
      // @UploadedFiles() returns undefined

      const result = await controller.createDiscussion(createDiscussionDto, mockUser, undefined);

      expect(service.create).toHaveBeenCalledWith(createDiscussionDto, mockUser, undefined);
      expect(service.formatDiscussionResponse).toHaveBeenCalledWith(mockDiscussion, mockUser);
      expect(result).toEqual(mockDiscussionResponse);
    });

    it('should pass currentUser to formatDiscussionResponse for anonymous handling', async () => {
      // Override mock implementation for this specific test
      jest.spyOn(service, 'formatDiscussionResponse').mockImplementationOnce((discussion, user) => {
        expect(user).toBe(mockUser);
        return mockDiscussionResponse;
      });

      await controller.createDiscussion(createDiscussionDto, mockUser, [mockFile]);

      expect(service.formatDiscussionResponse).toHaveBeenCalledWith(mockDiscussion, mockUser);
    });

    it('should handle large file uploads within FilesInterceptor limits', async () => {
      // This test verifies controller accepts files under the limit
      // FilesInterceptor('files', 4) allows up to 4 files

      const multipleFiles = [
        mockFile,
        { ...mockFile, originalname: 'second.pdf' },
        { ...mockFile, originalname: 'third.pdf' },
        { ...mockFile, originalname: 'fourth.pdf' },
      ];

      const result = await controller.createDiscussion(createDiscussionDto, mockUser, multipleFiles);

      expect(service.create).toHaveBeenCalledWith(createDiscussionDto, mockUser, multipleFiles);
      expect(service.formatDiscussionResponse).toHaveBeenCalledWith(mockDiscussion, mockUser);
      expect(result).toEqual(mockDiscussionResponse);
    });
  });
});
