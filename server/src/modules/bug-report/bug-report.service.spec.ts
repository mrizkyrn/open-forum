import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../user/entities/user.entity';
import { BugReportService } from './bug-report.service';
import { BugPriority, BugReport, BugStatus } from './entities/bug-report.entity';

describe('BugReportService', () => {
  let service: BugReportService;
  let repository: Repository<BugReport>;

  const mockBugReportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
  } as User;

  const mockAdminUser: User = {
    id: 2,
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  } as User;

  const mockBugReport: BugReport = {
    id: 1,
    title: 'Test Bug',
    description: 'Test bug description',
    status: BugStatus.OPEN,
    priority: BugPriority.MEDIUM,
    reporterId: 1,
    assignedToId: null,
    reporter: mockUser,
    assignedTo: null,
    stepsToReproduce: null,
    environment: null,
    resolution: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BugReport;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BugReportService,
        {
          provide: getRepositoryToken(BugReport),
          useValue: mockBugReportRepository,
        },
      ],
    }).compile();

    service = module.get<BugReportService>(BugReportService);
    repository = module.get<Repository<BugReport>>(getRepositoryToken(BugReport));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new bug report', async () => {
      const createDto = {
        title: 'Test Bug',
        description: 'Test bug description',
        priority: BugPriority.HIGH,
      };

      mockBugReportRepository.create.mockReturnValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue(mockBugReport);
      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);

      const result = await service.create(createDto, mockUser);

      expect(mockBugReportRepository.create).toHaveBeenCalledWith({
        ...createDto,
        reporterId: mockUser.id,
        status: BugStatus.OPEN,
      });
      expect(mockBugReportRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return a bug report when found', async () => {
      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);

      const result = await service.findById(1);

      expect(mockBugReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['reporter', 'assignedTo'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when bug report not found', async () => {
      mockBugReportRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should allow reporter to update their own bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const updatedBugReport = { ...mockBugReport, ...updateDto };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue(updatedBugReport);

      await service.update(1, updateDto, mockUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to update others bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const otherUserBugReport = { ...mockBugReport, reporterId: 999 };

      mockBugReportRepository.findOne.mockResolvedValue(otherUserBugReport);

      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any bug report', async () => {
      const updateDto = { status: BugStatus.RESOLVED, resolution: 'Fixed' };
      const updatedBugReport = { ...mockBugReport, ...updateDto };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue(updatedBugReport);

      await service.update(1, updateDto, mockAdminUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to update resolved bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const resolvedBugReport = { ...mockBugReport, status: BugStatus.RESOLVED };

      mockBugReportRepository.findOne.mockResolvedValue(resolvedBugReport);

      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(
        new ForbiddenException('Cannot update bug reports that are already resolved or closed'),
      );
    });

    it('should throw ForbiddenException when non-admin tries to update closed bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const closedBugReport = { ...mockBugReport, status: BugStatus.CLOSED };

      mockBugReportRepository.findOne.mockResolvedValue(closedBugReport);

      await expect(service.update(1, updateDto, mockUser)).rejects.toThrow(
        new ForbiddenException('Cannot update bug reports that are already resolved or closed'),
      );
    });

    it('should allow admin to update resolved bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const resolvedBugReport = { ...mockBugReport, status: BugStatus.RESOLVED };
      const updatedBugReport = { ...resolvedBugReport, ...updateDto };

      mockBugReportRepository.findOne.mockResolvedValue(resolvedBugReport);
      mockBugReportRepository.save.mockResolvedValue(updatedBugReport);

      await service.update(1, updateDto, mockAdminUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should allow non-admin to update open bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const openBugReport = { ...mockBugReport, status: BugStatus.OPEN };
      const updatedBugReport = { ...openBugReport, ...updateDto };

      mockBugReportRepository.findOne.mockResolvedValue(openBugReport);
      mockBugReportRepository.save.mockResolvedValue(updatedBugReport);

      await service.update(1, updateDto, mockUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should allow non-admin to update in-progress bug report', async () => {
      const updateDto = { title: 'Updated Bug Title' };
      const inProgressBugReport = { ...mockBugReport, status: BugStatus.IN_PROGRESS };
      const updatedBugReport = { ...inProgressBugReport, ...updateDto };

      mockBugReportRepository.findOne.mockResolvedValue(inProgressBugReport);
      mockBugReportRepository.save.mockResolvedValue(updatedBugReport);

      await service.update(1, updateDto, mockUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });
  });

  describe('assignBugReport', () => {
    it('should allow admin to assign bug report', async () => {
      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue({
        ...mockBugReport,
        assignedToId: 3,
        status: BugStatus.IN_PROGRESS,
      });

      await service.assignBugReport(1, 3, mockAdminUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to assign', async () => {
      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);

      await expect(service.assignBugReport(1, 3, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const mockAssignedUser: User = {
      id: 3,
      username: 'assigneduser',
      fullName: 'Assigned User',
      email: 'assigned@example.com',
      role: UserRole.USER,
    } as User;

    beforeEach(() => {
      jest.spyOn(service, 'findById');
    });

    it('should allow admin to update any bug report status', async () => {
      const updateStatusDto = {
        status: BugStatus.RESOLVED,
        resolution: 'Fixed the issue',
      };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue({
        ...mockBugReport,
        ...updateStatusDto,
      });
      (service.findById as jest.Mock).mockResolvedValue({
        ...mockBugReport,
        ...updateStatusDto,
      });

      await service.updateStatus(1, updateStatusDto, mockAdminUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
      expect(mockBugReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['reporter', 'assignedTo'],
      });
    });

    it('should allow assigned user to update status of their assigned bug report', async () => {
      const assignedBugReport = {
        ...mockBugReport,
        assignedToId: 3,
      };
      const updateStatusDto = {
        status: BugStatus.IN_PROGRESS,
      };

      mockBugReportRepository.findOne.mockResolvedValue(assignedBugReport);
      mockBugReportRepository.save.mockResolvedValue({
        ...assignedBugReport,
        ...updateStatusDto,
      });
      (service.findById as jest.Mock).mockResolvedValue({
        ...assignedBugReport,
        ...updateStatusDto,
      });

      await service.updateStatus(1, updateStatusDto, mockAssignedUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should allow reporter to mark their own bug report as resolved', async () => {
      const updateStatusDto = {
        status: BugStatus.RESOLVED,
        resolution: 'Fixed by myself',
      };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.save.mockResolvedValue({
        ...mockBugReport,
        ...updateStatusDto,
      });
      (service.findById as jest.Mock).mockResolvedValue({
        ...mockBugReport,
        ...updateStatusDto,
      });

      await service.updateStatus(1, updateStatusDto, mockUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no permission to update status', async () => {
      const otherUser: User = {
        id: 999,
        username: 'otheruser',
        fullName: 'Other User',
        email: 'other@example.com',
        role: UserRole.USER,
      } as User;

      const updateStatusDto = {
        status: BugStatus.IN_PROGRESS,
      };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);

      await expect(service.updateStatus(1, updateStatusDto, otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin reporter tries to set status other than resolved', async () => {
      const updateStatusDto = {
        status: BugStatus.CLOSED,
      };

      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);

      await expect(service.updateStatus(1, updateStatusDto, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when resolution is required but not provided', async () => {
      const updateStatusDto = {
        status: BugStatus.RESOLVED,
      };

      // Ensure the mock bug report has no resolution
      const bugReportWithoutResolution = {
        ...mockBugReport,
        resolution: null,
      };

      mockBugReportRepository.findOne.mockResolvedValue(bugReportWithoutResolution);
      // Don't mock save or findById since we expect the method to throw before reaching them

      await expect(service.updateStatus(1, updateStatusDto, mockAdminUser)).rejects.toThrow(BadRequestException);

      // Verify that save was not called since validation should fail first
      expect(mockBugReportRepository.save).not.toHaveBeenCalled();
    });

    it('should allow status update when existing resolution is present', async () => {
      const bugReportWithResolution = {
        ...mockBugReport,
        resolution: 'Existing resolution',
      };
      const updateStatusDto = {
        status: BugStatus.CLOSED,
      };

      mockBugReportRepository.findOne.mockResolvedValue(bugReportWithResolution);
      mockBugReportRepository.save.mockResolvedValue({
        ...bugReportWithResolution,
        ...updateStatusDto,
      });
      (service.findById as jest.Mock).mockResolvedValue({
        ...bugReportWithResolution,
        ...updateStatusDto,
      });

      await service.updateStatus(1, updateStatusDto, mockAdminUser);

      expect(mockBugReportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when bug report does not exist', async () => {
      const updateStatusDto = {
        status: BugStatus.RESOLVED,
        resolution: 'Fixed',
      };

      mockBugReportRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, updateStatusDto, mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should allow reporter to delete their own bug report', async () => {
      mockBugReportRepository.findOne.mockResolvedValue(mockBugReport);
      mockBugReportRepository.remove.mockResolvedValue(mockBugReport);

      await service.remove(1, mockUser);

      expect(mockBugReportRepository.remove).toHaveBeenCalledWith(mockBugReport);
    });

    it('should throw ForbiddenException when non-admin tries to delete others bug report', async () => {
      const otherUserBugReport = { ...mockBugReport, reporterId: 999 };
      mockBugReportRepository.findOne.mockResolvedValue(otherUserBugReport);

      await expect(service.remove(1, mockUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
