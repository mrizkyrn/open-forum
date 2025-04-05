import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AcademicService } from '../academic/academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin/academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('sync-faculties')
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync faculties data from external API' })
  @ApiResponse({ status: 200, description: 'Faculties synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error syncing faculties' })
  async syncFaculties() {
    const faculties = await this.academicService.syncFacultiesFromApi();
    return {
      message: 'Faculties synced successfully',
      count: faculties.length,
    };
  }

  @Post('sync-study-programs')
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync study programs data from external API' })
  @ApiResponse({ status: 200, description: 'Study programs synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error syncing study programs' })
  async syncStudyPrograms() {
    const programs = await this.academicService.syncStudyProgramsFromApi();
    return {
      message: 'Study programs synced successfully',
      count: programs.length,
    };
  }
}
