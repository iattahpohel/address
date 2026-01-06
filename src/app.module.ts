import { ConfigModule, ConfigService } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { InMemoryDBModule } from '@nestjs-addons/in-memory-db'
import { CityModule } from './city/city.module'
import { DistrictModule } from './district/district.module'
import { WardModule } from './ward/ward.module'
import { UtilsModule } from '@lib/utils'
import { HttpModule } from '@nestjs/axios'
import { CountryModule } from './country/country.module'
import { StateModule } from './state/state.module'
import { BullModule } from '@nestjs/bull'
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis'
import { RedisxModule } from 'libs/core/components/redis/redis.module'
import { MyConfigModule } from './config/config.module'
import { CommonModule } from './common/common.module'
import { ZoneModule } from './zone/zone.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MyConfigService } from './config/config.service'

@Module({
  imports: [
    InMemoryDBModule.forRoot({}),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule, MyConfigModule],
      useFactory: async (myConfigService: MyConfigService) => ({
        redis: {
          host: myConfigService.redisHost,
          port: myConfigService.redisPort,
        },
      }),
      inject: [MyConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, MyConfigModule],
      useFactory: (myConfigService: MyConfigService) => ({
        type: 'mysql',
        host: myConfigService.mysqlHost,
        port: myConfigService.mysqlPort,
        username: myConfigService.mysqlUser,
        password: myConfigService.mysqlPassword,
        database: myConfigService.mysqlDatabase,
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: myConfigService.synchronizeDatabase,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [MyConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule, MyConfigModule],
      inject: [MyConfigService],
      useFactory: async (
        myConfigService: MyConfigService,
      ): Promise<RedisModuleOptions> => {
        return {
          config: {
            host: myConfigService.redisHost,
            port: myConfigService.redisPort,
          },
        }
      },
    }),
    CommonModule,
    RedisxModule,
    MyConfigModule,
    UtilsModule,
    HttpModule,
    CityModule,
    DistrictModule,
    WardModule,
    CountryModule,
    StateModule,
    ZoneModule,
    ScheduleModule.forRoot(),
  ],

  providers: [],
})
export class AppModule {}
