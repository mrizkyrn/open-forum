import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../../common/dto/search.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../user/entities/user.entity';
import { BugReportController } from './bug-report.controller';
import { BugReportService } from './bug-report.service';
import {
  BugReportSortBy,
  CreateBugReportDto,
  SearchBugReportDto,
  UpdateBugReportDto,
  UpdateBugReportStatusDto,
} from './dto';
import { BugPriority, BugStatus } from './entities/bug-report.entity';

describe('BugReportController', () => {
  let controller: BugReportController;
  let service: BugReportService;

  const mockBugReportService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignBugReport: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
  } as User;

  const mockBugReportResponse = {
    id: 1,
    title: 'Test Bug',
    description: 'Test bug description',
    status: BugStatus.OPEN,
    priority: BugPriority.MEDIUM,
    reporter: mockUser,
    assignedTo: null,
    stepsToReproduce: null,
    environment: null,
    resolution: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BugReportController],
      providers: [
        {
          provide: BugReportService,
          useValue: mockBugReportService,
        },
      ],
    }).compile();

    controller = module.get<BugReportController>(BugReportController);
    service = module.get<BugReportService>(BugReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBugReport', () => {
    it('should create a new bug report', async () => {
      const createDto: CreateBugReportDto = {
        title: 'Test Bug',
        description: 'Test bug description',
        priority: BugPriority.HIGH,
      };

      mockBugReportService.create.mockResolvedValue(mockBugReportResponse);

      const result = await controller.createBugReport(createDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(mockBugReportResponse);
    });
  });

  describe('getAllBugReports', () => {
    it('should return paginated bug reports', async () => {
      const searchDto: SearchBugReportDto = {
        page: 1,
        limit: 10,
        sortBy: BugReportSortBy.CREATED_AT,
        sortOrder: SortOrder.DESC,
      };

      const mockPaginatedResponse = {
        items: [mockBugReportResponse],
        meta: {
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockBugReportService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getAllBugReports(searchDto, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(searchDto, mockUser);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getBugReportById', () => {
    it('should return a bug report by id', async () => {
      mockBugReportService.findById.mockResolvedValue(mockBugReportResponse);

      const result = await controller.getBugReportById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBugReportResponse);
    });
  });

  describe('updateBugReport', () => {
    it('should update a bug report', async () => {
      const updateDto: UpdateBugReportDto = {
        title: 'Updated Bug Title',
      };

      const updatedResponse = {
        ...mockBugReportResponse,
        title: 'Updated Bug Title',
      };

      mockBugReportService.update.mockResolvedValue(updatedResponse);

      const result = await controller.updateBugReport(1, updateDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockUser);
      expect(result).toEqual(updatedResponse);
    });
  });

  describe('deleteBugReport', () => {
    it('should delete a bug report', async () => {
      mockBugReportService.remove.mockResolvedValue(undefined);

      await controller.deleteBugReport(1, mockUser);

      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('assignBugReport', () => {
    it('should assign a bug report to a user', async () => {
      const assignedResponse = {
        ...mockBugReportResponse,
        assignedToId: 2,
        status: BugStatus.IN_PROGRESS,
      };

      mockBugReportService.assignBugReport.mockResolvedValue(assignedResponse);

      const result = await controller.assignBugReport(1, 2, mockUser);

      expect(service.assignBugReport).toHaveBeenCalledWith(1, 2, mockUser);
      expect(result).toEqual(assignedResponse);
    });

    it('should unassign a bug report when userId is 0', async () => {
      const unassignedResponse = {
        ...mockBugReportResponse,
        assignedToId: null,
      };

      mockBugReportService.assignBugReport.mockResolvedValue(unassignedResponse);

      const result = await controller.assignBugReport(1, 0, mockUser);

      expect(service.assignBugReport).toHaveBeenCalledWith(1, null, mockUser);
      expect(result).toEqual(unassignedResponse);
    });
  });

  describe('updateBugReportStatus', () => {
    it('should update bug report status successfully', async () => {
      const updateStatusDto: UpdateBugReportStatusDto = {
        status: BugStatus.RESOLVED,
        resolution: 'Fixed the authentication issue',
      };

      const updatedResponse = {
        ...mockBugReportResponse,
        status: BugStatus.RESOLVED,
        resolution: 'Fixed the authentication issue',
      };

      mockBugReportService.updateStatus.mockResolvedValue(updatedResponse);

      const result = await controller.updateBugReportStatus(1, updateStatusDto, mockUser);

      expect(service.updateStatus).toHaveBeenCalledWith(1, updateStatusDto, mockUser);
      expect(result).toEqual(updatedResponse);
    });

    it('should update status without resolution', async () => {
      const updateStatusDto: UpdateBugReportStatusDto = {
        status: BugStatus.IN_PROGRESS,
      };

      const updatedResponse = {
        ...mockBugReportResponse,
        status: BugStatus.IN_PROGRESS,
      };

      mockBugReportService.updateStatus.mockResolvedValue(updatedResponse);

      const result = await controller.updateBugReportStatus(1, updateStatusDto, mockUser);

      expect(service.updateStatus).toHaveBeenCalledWith(1, updateStatusDto, mockUser);
      expect(result).toEqual(updatedResponse);
    });

    it('should handle status update with only resolution provided', async () => {
      const updateStatusDto: UpdateBugReportStatusDto = {
        status: BugStatus.CLOSED,
        resolution: 'Duplicate issue - closed',
      };

      const updatedResponse = {
        ...mockBugReportResponse,
        status: BugStatus.CLOSED,
        resolution: 'Duplicate issue - closed',
      };

      mockBugReportService.updateStatus.mockResolvedValue(updatedResponse);

      const result = await controller.updateBugReportStatus(1, updateStatusDto, mockUser);

      expect(service.updateStatus).toHaveBeenCalledWith(1, updateStatusDto, mockUser);
      expect(result).toEqual(updatedResponse);
    });
  });
});
