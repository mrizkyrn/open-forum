import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { SearchDto } from '../../common/dto/search.dto';
import { ExternalApiConfig } from '../../config';
import { Faculty } from '../academic/entity/faculty.entity';
import { StudyProgram } from '../academic/entity/study-program.entity';
import { FacultyResponseDto, PageableFacultyResponseDto } from './dto/faculty-response.dto';
import { SearchStudyProgramDto } from './dto/search-study-program.dto';
import { PageableStudyProgramResponseDto, StudyProgramResponseDto } from './dto/study-program-response.dto';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    @InjectRepository(Faculty)
    private facultyRepository: Repository<Faculty>,
    @InjectRepository(StudyProgram)
    private studyProgramRepository: Repository<StudyProgram>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  // ----- Faculty Operations ----- //

  async findAllFaculties(searchDto: SearchDto): Promise<PageableFacultyResponseDto> {
    const { page, limit, search } = searchDto;
    const offset = (page - 1) * limit;

    try {
      const queryBuilder = this.facultyRepository
        .createQueryBuilder('faculty')
        .orderBy('faculty.facultyCode', 'ASC')
        .skip(offset)
        .take(limit);

      if (search) {
        queryBuilder.where('faculty.facultyName ILIKE :search or faculty.facultyAbbreviation ILIKE :search', {
          search: `%${search}%`,
        });
      }

      const [faculties, totalItems] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(totalItems / limit);

      return {
        items: faculties.map((faculty) => FacultyResponseDto.fromEntity(faculty)),
        meta: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching faculties: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFacultyById(id: number): Promise<FacultyResponseDto> {
    try {
      const faculty = await this.facultyRepository.findOne({
        where: { id },
      });

      if (!faculty) {
        throw new NotFoundException(`Faculty with ID ${id} not found`);
      }

      return FacultyResponseDto.fromEntity(faculty);
    } catch (error) {
      this.logger.error(`Error finding faculty by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findFacultyByCode(code: string): Promise<FacultyResponseDto> {
    try {
      const faculty = await this.facultyRepository.findOne({
        where: { facultyCode: code },
      });

      if (!faculty) {
        throw new NotFoundException(`Faculty with code ${code} not found`);
      }

      return FacultyResponseDto.fromEntity(faculty);
    } catch (error) {
      this.logger.error(`Error finding faculty by code ${code}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Study Program Operations ----- //

  async findAllStudyPrograms(searchDto: SearchStudyProgramDto): Promise<PageableStudyProgramResponseDto> {
    const { page, limit, search, sortOrder, sortBy, facultyId, educationLevel } = searchDto;
    const offset = (page - 1) * limit;

    try {
      const queryBuilder = this.studyProgramRepository
        .createQueryBuilder('studyProgram')
        .leftJoinAndSelect('studyProgram.faculty', 'faculty')
        .orderBy(`studyProgram.${sortBy || 'studyProgramCode'}`, sortOrder || 'ASC')
        .skip(offset)
        .take(limit);

      if (search) {
        queryBuilder.where('studyProgram.studyProgramName ILIKE :search', { search: `%${search}%` });
      }

      if (facultyId) {
        queryBuilder.andWhere('studyProgram.facultyId = :facultyId', { facultyId });
      }

      if (educationLevel) {
        queryBuilder.andWhere('studyProgram.educationLevel ILIKE :educationLevel', {
          educationLevel: `${educationLevel}`,
        });
      }

      const [studyPrograms, totalItems] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(totalItems / limit);

      return {
        items: studyPrograms.map((program) => StudyProgramResponseDto.fromEntity(program)),
        meta: {
          totalItems,
          itemsPerPage: limit,
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching study programs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findStudyProgramById(id: number): Promise<StudyProgramResponseDto> {
    try {
      const studyProgram = await this.studyProgramRepository.findOne({
        where: { id },
        relations: ['faculty'],
      });

      if (!studyProgram) {
        throw new NotFoundException(`Study program with ID ${id} not found`);
      }

      return StudyProgramResponseDto.fromEntity(studyProgram);
    } catch (error) {
      this.logger.error(`Error finding study program by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findStudyProgramByCode(code: string): Promise<StudyProgramResponseDto> {
    try {
      const studyProgram = await this.studyProgramRepository.findOne({
        where: { studyProgramCode: code },
        relations: ['faculty'],
      });

      if (!studyProgram) {
        throw new NotFoundException(`Study program with code ${code} not found`);
      }

      return StudyProgramResponseDto.fromEntity(studyProgram);
    } catch (error) {
      this.logger.error(`Error finding study program by code ${code}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Sync Operations ----- //

  async syncFacultiesFromApi(): Promise<Faculty[]> {
    try {
      const apiConfig = this.configService.get<ExternalApiConfig>('externalApi');
      if (!apiConfig) {
        throw new BadRequestException('External API configuration is missing');
      }

      // Make API request
      const { data } = await lastValueFrom(
        this.httpService.post<any>(
          `${apiConfig.baseUrl}/data/ref_fakultas`,
          {},
          {
            auth: {
              username: apiConfig.username,
              password: apiConfig.password,
            },
            headers: {
              API_KEY_NAME: apiConfig.keyName,
              API_KEY_SECRET: apiConfig.keySecret,
            },
          },
        ),
      );

      // Process and save the data
      const faculties: Faculty[] = [];

      for (const facultyData of data.data) {
        // Find existing faculty by code or create new one
        let faculty = await this.facultyRepository.findOne({
          where: { facultyCode: facultyData.kode_fakultas },
        });

        if (!faculty) {
          faculty = new Faculty();
          faculty.facultyCode = facultyData.kode_fakultas;
        }

        // Map API data to entity
        faculty.facultyName = facultyData.nama_fakultas;
        faculty.facultyAbbreviation = facultyData.singkatan_fakultas;
        faculty.deanName = facultyData.nama_dosen_dekan;
        faculty.viceDean1Name = facultyData.nama_dosen_wadek_1;
        faculty.viceDean2Name = facultyData.nama_dosen_wadek_2;
        faculty.viceDean3Name = facultyData.nama_dosen_wadek_3;
        faculty.updatedAt = new Date();

        // Save faculty
        const savedFaculty = await this.facultyRepository.save(faculty);
        faculties.push(savedFaculty);
      }

      return faculties;
    } catch (error) {
      this.logger.error(`Failed to sync faculties: ${error.message}`, error.stack);
      throw new Error(`Failed to sync faculties: ${error.message}`);
    }
  }

  async syncStudyProgramsFromApi(): Promise<StudyProgram[]> {
    try {
      const apiConfig = this.configService.get<ExternalApiConfig>('externalApi');
      if (!apiConfig) {
        throw new BadRequestException('External API configuration is missing');
      }

      // Make API request
      const { data } = await lastValueFrom(
        this.httpService.post<any>(
          `${apiConfig.baseUrl}/data/ref_program_studi`,
          {},
          {
            auth: {
              username: apiConfig.username,
              password: apiConfig.password,
            },
            headers: {
              API_KEY_NAME: apiConfig.keyName,
              API_KEY_SECRET: apiConfig.keySecret,
            },
          },
        ),
      );

      // Process and save the data
      const studyPrograms: StudyProgram[] = [];

      for (const programData of data.data) {
        // Find the associated faculty
        const faculty = await this.facultyRepository.findOne({
          where: { facultyCode: programData.kode_fakultas },
        });

        if (!faculty) {
          this.logger.warn(
            `Faculty with code ${programData.kode_fakultas} not found for program ${programData.nama_program_studi}`,
          );
          continue;
        }

        // Find existing study program by code or create new one
        let studyProgram = await this.studyProgramRepository.findOne({
          where: { studyProgramCode: programData.kode_program_studi },
        });

        if (!studyProgram) {
          studyProgram = new StudyProgram();
          studyProgram.studyProgramCode = programData.kode_program_studi;
        }

        // Map API data to entity
        studyProgram.studyProgramName = programData.nama_program_studi;
        studyProgram.educationLevel = programData.program_pendidikan;
        studyProgram.facultyId = faculty.id;
        studyProgram.directorName = programData.nama_dosen_ketua_prodi;
        studyProgram.updatedAt = new Date();

        // Save study program
        const savedProgram = await this.studyProgramRepository.save(studyProgram);
        studyPrograms.push(savedProgram);
      }

      return studyPrograms;
    } catch (error) {
      this.logger.error(`Failed to sync study programs: ${error.message}`, error.stack);
      throw new Error(`Failed to sync study programs: ${error.message}`);
    }
  }
}
