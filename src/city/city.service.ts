import { City } from '@generated/city/city'
import { CityListDataReply } from '@generated/city/city_reply'
import CustomException from '@lib/utils/custom.exception'
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Result } from 'neverthrow'
import { GetCityConditionRequestDto } from './dto/get-city-condition'
import { CityInMemoryRepository } from './provider/city.repository'
import { join } from 'path'
import { promises } from 'fs'
import * as CONST from './provider/city.constant'
import { CityEntity } from './entities/city.entity'

interface CityJsonData {
  city_id: number
  city_name: string
  grant: string
  city_slug: string
  country_id: number
  state_id?: number | null
}

/**
 * Service for city-related business logic
 */
@Injectable()
export class CityService implements OnModuleInit {
  private readonly logger = new Logger(CityService.name)

  constructor(private readonly repo: CityInMemoryRepository) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing city data from file...')
      const filePath = join(__dirname, '../../../data/', CONST.DATA_NAME)
      const fileContent = await promises.readFile(filePath, 'utf8')
      const jsonData: CityJsonData[] = JSON.parse(fileContent)

      if (!jsonData || !Array.isArray(jsonData)) {
        throw new CustomException(
          'INVALID_DATA_FILE',
          `Cannot read or parse city data file: ${CONST.DATA_NAME}`,
          HttpStatus.BAD_REQUEST,
        )
      }

      const data: CityEntity[] = jsonData.map((each: CityJsonData) => {
        const city: CityEntity = {
          cityId: each.city_id,
          cityName: each.city_name,
          grant: each.grant,
          citySlug: each.city_slug,
          countryId: each.country_id,
          stateId: each.state_id ?? null,
        }
        return city
      })

      const result = await this.repo.createListCityInMemory(data)
      if (result.isErr()) {
        throw new CustomException(
          'DATA_LOAD_ERROR',
          `Failed to load city data into memory: ${result.error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      this.logger.log(`Successfully loaded ${data.length} cities into memory`)
    } catch (error) {
      this.logger.error(
        `Failed to initialize city service: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw error
    }
  }

  /**
   * Get city detail by condition
   */
  async getDetail(
    condition: GetCityConditionRequestDto,
  ): Promise<Result<City, Error>> {
    this.logger.debug(`Getting city detail with condition: ${JSON.stringify(condition)}`)
    return await this.repo.getDetail(condition)
  }

  /**
   * Get list of cities by condition
   */
  async getList(
    condition: GetCityConditionRequestDto,
  ): Promise<Result<CityListDataReply, Error>> {
    this.logger.debug(`Getting city list with condition: ${JSON.stringify(condition)}`)
    return await this.repo.getList(condition)
  }
}
