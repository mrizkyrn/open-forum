import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchDto } from '../../common/dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicService } from './academic.service';
import { FacultyResponseDto, PageableFacultyResponseDto } from './dto/faculty-response.dto';
import { SearchStudyProgramDto } from './dto/search-study-program.dto';
import { PageableStudyProgramResponseDto, StudyProgramResponseDto } from './dto/study-program-response.dto';

@ApiTags('Academic')
@Controller('academic')
@UseGuards(JwtAuthGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('faculties')
  @ApiOperation({ summary: 'Get all faculties' })
  @ApiResponse({ status: 200, description: 'List of faculties', type: PageableFacultyResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllFaculties(@Query() searchDto: SearchDto): Promise<PageableFacultyResponseDto> {
    return this.academicService.findAllFaculties(searchDto);
  }

  @Get('faculties/:id')
  @ApiOperation({ summary: 'Get a faculty by ID' })
  @ApiParam({ name: 'id', description: 'Faculty ID', type: Number })
  @ApiQuery({
    name: 'includeStudyPrograms',
    description: 'Include study programs in response',
    type: Boolean,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Faculty details', type: FacultyResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  async findFacultyById(@Param('id', ParseIntPipe) id: number): Promise<FacultyResponseDto> {
    return this.academicService.findFacultyById(id);
  }

  @Get('faculties/code/:code')
  @ApiOperation({ summary: 'Get a faculty by code' })
  @ApiParam({ name: 'code', description: 'Faculty code', type: String })
  @ApiQuery({
    name: 'includeStudyPrograms',
    description: 'Include study programs in response',
    type: Boolean,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Faculty details', type: FacultyResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  async findFacultyByCode(@Param('code') code: string): Promise<FacultyResponseDto> {
    return this.academicService.findFacultyByCode(code);
  }

  @Get('study-programs')
  @ApiOperation({ summary: 'Get all study programs' })
  @ApiResponse({ status: 200, description: 'List of study programs', type: PageableStudyProgramResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllStudyPrograms(@Query() searchDto: SearchStudyProgramDto): Promise<PageableStudyProgramResponseDto> {
    return this.academicService.findAllStudyPrograms(searchDto);
  }

  @Get('study-programs/:id')
  @ApiOperation({ summary: 'Get a study program by ID' })
  @ApiParam({ name: 'id', description: 'Study Program ID', type: Number })
  @ApiQuery({
    name: 'includeFaculty',
    description: 'Include faculty details in response',
    type: Boolean,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Study program details', type: StudyProgramResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Study program not found' })
  async findStudyProgramById(@Param('id', ParseIntPipe) id: number): Promise<StudyProgramResponseDto> {
    return this.academicService.findStudyProgramById(id);
  }

  @Get('study-programs/code/:code')
  @ApiOperation({ summary: 'Get a study program by code' })
  @ApiParam({ name: 'code', description: 'Study program code', type: String })
  @ApiQuery({
    name: 'includeFaculty',
    description: 'Include faculty details in response',
    type: Boolean,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Study program details', type: StudyProgramResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Study program not found' })
  async findStudyProgramByCode(@Param('code') code: string): Promise<StudyProgramResponseDto> {
    return this.academicService.findStudyProgramByCode(code);
  }
}
