import IntervalTree, { Interval } from '@flatten-js/interval-tree'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ZoneRepository } from './provider/zone.repository'
import { Zone, ZoneData } from '@generated/zone/zone'
import { GetZoneByZipcodeRequestDto } from './dto/get-zone-by-zipcode.dto'
import { err, ok, Result } from 'neverthrow'
import * as CONST from './provider/zone.constant'
import { REDIS_ZONE_CHANEL, REDIS_ZONE_MESSAGE } from './provider/zone.constant'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisxService } from 'libs/core/components/redis/redis.service'
import { ZoneFunction } from '@/zone/provider/zone.function'
import { RedisPubSubService } from 'libs/core/components/redis/redis-pubsub.service'
import { TIME_CONSTANTS } from '@/common/constants'

@Injectable()
export class ZoneService implements OnModuleInit {
  private readonly logger = new Logger(ZoneService.name)
  private dataZone: Map<string, IntervalTree<string>>

  constructor(
    private readonly repo: ZoneRepository,
    private readonly redisxService: RedisxService,
    private readonly zoneFunction: ZoneFunction,
    private readonly redisPubSubService: RedisPubSubService,
    @InjectQueue(CONST.QUEUE_ZONE) private readonly queue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleCronCrawl(): Promise<void> {
    const resp = await this.redisxService.setnx(CONST.ZONE_CRON_KEY_CRAWL, 1)

    if (resp.isOk() && resp.value) {
      await this.redisxService.expire(
        CONST.ZONE_CRON_KEY_CRAWL,
        TIME_CONSTANTS.ONE_HOUR,
      )
      this.logger.log('Cron job: Starting zone crawl')

      await this.initZoneUSPS()
      this.logger.log('Cron job: Zone crawl completed')
    } else {
      this.logger.debug('Cron job: Zone crawl already running, skipping')
    }

    // TODO: zone ups...
  }

  @Cron('0 1 1 * *') // EVERY_1ST_DAY_OF_MONTH_AT_1_AM
  async handleCronIntervalTree(): Promise<void> {
    const resp = await this.redisxService.setnx(CONST.ZONE_CRON_KEY_TREE, 1)

    if (resp.isOk() && resp.value) {
      await this.redisxService.expire(
        CONST.ZONE_CRON_KEY_TREE,
        TIME_CONSTANTS.ONE_HOUR,
      )
      this.logger.log('Cron job: Initializing interval tree')

      this.logger.log(
        'Publishing sync message to all subscribed cluster instances',
      )
      this.redisPubSubService.publish(REDIS_ZONE_CHANEL, REDIS_ZONE_MESSAGE)
    } else {
      this.logger.debug(
        'Cron job: Interval tree initialization already running, skipping',
      )
    }
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing zone service...')
    await this.initIntervalTree()

    this.redisPubSubService.subscribe(REDIS_ZONE_CHANEL, (channel, message) => {
      this.logger.debug(
        `Received message from channel ${channel}: ${message}`,
      )
      // Nếu trong channel có message sync thì init lại interval tree
      if (message === REDIS_ZONE_MESSAGE) {
        this.logger.log('Received sync message, reinitializing interval tree')
        this.initIntervalTree()
      }
    })
    this.logger.log('Zone service initialized successfully')
  }

  async getZoneByZipcode(
    request: GetZoneByZipcodeRequestDto,
  ): Promise<Result<string, Error>> {
    try {
      const zipcode3From = request.zipcodeFrom.substring(0, 3)
      const zipcode3To = request.zipcodeTo.substring(0, 3)

      // Search exception tree first with zip5
      const keyGetException = this.zoneFunction.genKeyTreeException(
        zipcode3From,
        request.zoneType,
      )
      const treeException = this.dataZone.get(keyGetException)

      if (treeException !== undefined) {
        const zipcodeToInt = parseInt(request.zipcodeTo, 10)
        if (isNaN(zipcodeToInt)) {
          return err(new Error(`Invalid zipcode format: ${request.zipcodeTo}`))
        }

        const valuesException = treeException.search([
          zipcodeToInt,
          zipcodeToInt,
        ])

        if (valuesException[0]) {
          try {
            const row: string = JSON.parse(valuesException[0])
            if (row) {
              return ok(row)
            }
          } catch (parseError) {
            this.logger.error(
              `Failed to parse zone exception data: ${parseError}`,
            )
            return err(new Error('Cannot parse zone exception data'))
          }
        }
      }

      // Otherwise search zip3
      const keyGet = this.zoneFunction.genKeyTree(
        zipcode3From,
        request.zoneType,
      )
      const tree = this.dataZone.get(keyGet)
      if (tree !== undefined) {
        const zipcode3ToInt = parseInt(zipcode3To, 10)
        if (isNaN(zipcode3ToInt)) {
          return err(new Error(`Invalid zipcode format: ${zipcode3To}`))
        }

        const values = tree.search([zipcode3ToInt, zipcode3ToInt])

        if (values[0]) {
          try {
            const row: string = JSON.parse(values[0])
            if (row) {
              return ok(row)
            }
          } catch (parseError) {
            this.logger.error(`Failed to parse zone data: ${parseError}`)
            return err(new Error('Cannot parse zone data'))
          }
        }
      }

      this.logger.debug(
        `Zone not found for zipcodeFrom: ${request.zipcodeFrom}, zipcodeTo: ${request.zipcodeTo}, zoneType: ${request.zoneType}`,
      )
      return err(
        new Error(
          `Zone not found for zipcode ${request.zipcodeFrom} to ${request.zipcodeTo}`,
        ),
      )
    } catch (error) {
      this.logger.error(
        `Error getting zone by zipcode: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      return err(
        new Error(
          `Failed to get zone: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      )
    }
  }

  async initZoneUSPS(): Promise<Result<boolean, Error>> {
    for (let i = CONST.START_ZIPCODE; i <= CONST.END_ZIPCODE; i++) {
      await this.queue.add(
        CONST.PROCESS_ZONE_INIT_USPS,
        this.zoneFunction.numberToZip3(i),
      )
    }

    return ok(true)
  }

  private async initIntervalTree(): Promise<void> {
    try {
      this.logger.log('Initializing interval tree from database...')
      const listAllZone = await this.repo.getList({})
      if (listAllZone.isOk()) {
        this.dataZone = this.createMapIntervalTree(listAllZone.value.zoneList)
        this.logger.log(
          `Interval tree initialized with ${this.dataZone.size} zone entries`,
        )
      } else {
        this.logger.error(
          `Failed to load zones: ${listAllZone.error.message}`,
        )
        throw listAllZone.error
      }
    } catch (error) {
      this.logger.error(
        `Error initializing interval tree: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw error
    }
  }

  private createIntervalTree(dataList: ZoneData[]) {
    const tree = new IntervalTree<string>()

    for (const data of dataList) {
      if (data.zipcodeFrom !== undefined) {
        const zoneString = JSON.stringify(data.zone)
        if (data.zipcodeTo) {
          tree.insert(
            new Interval(data.zipcodeFrom, data.zipcodeTo),
            zoneString,
          )
        } else {
          tree.insert(
            new Interval(data.zipcodeFrom, data.zipcodeFrom),
            zoneString,
          )
        }
      }
    }

    return tree
  }

  private createMapIntervalTree(listAllZone: Zone[]) {
    const dataZoneTemp = new Map<string, IntervalTree<string>>()

    for (const zone of listAllZone) {
      const tree = this.createIntervalTree(zone.data)
      const key = this.zoneFunction.genKeyTree(zone.zipcode, zone.zoneType)
      dataZoneTemp.set(key, tree)

      const treeException = this.createIntervalTree(zone.exceptionData)
      const keyException = this.zoneFunction.genKeyTreeException(
        zone.zipcode,
        zone.zoneType,
      )
      dataZoneTemp.set(keyException, treeException)
    }

    return dataZoneTemp
  }
}
