import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HandleReportDto } from '../report/dto/handle-report.dto';
import { ReportResponseDto } from '../report/dto/report-response.dto';
import { ReportService } from '../report/report.service';
import { User } from '../user/entities/user.entity';

@ApiTags('Admin')
@Controller('admin/reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':id/handle')
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle a report - update status and optionally delete content' })
  @ApiParam({ name: 'id', description: 'Report ID', type: Number })
  @ApiResponse({ status: 200, description: 'Report handled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to handle reports' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async handleReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() handleDto: HandleReportDto,
    @ReqUser() currentUser: User,
  ): Promise<ReportResponseDto> {
    return this.reportService.handleReport(id, handleDto, currentUser);
  }
}
