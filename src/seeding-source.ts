import { ClassConstructor, SeedingSourceOptions } from './types'

import { DataSource } from 'typeorm'
import { Runner } from './runner'
import { Seeder } from './seeder'
import { SeederImportException } from './exceptions/seeder-import.exception'
import { resolveDataSource } from './utils/resolve-data-source'

export class SeedingSource {
  /**
   * This seeding source's config manager
   */
  readonly run: Runner = new Runner(this)

  private _dataSource: DataSource | undefined

  /**
   * Ctor
   */
  constructor(private options: SeedingSourceOptions) {}

  get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = resolveDataSource(this.options.dataSource)
    }

    return this._dataSource
  }

  set dataSource(dataSource: DataSource) {
    this._dataSource = dataSource
  }

  get seeders(): ClassConstructor<Seeder>[] {
    return this.options.seeders ?? []
  }

  get defaultSeeders(): ClassConstructor<Seeder>[] | undefined {
    return this.options.defaultSeeders
  }

  seedersFromString(seederNameString = ''): ClassConstructor<Seeder<any>>[] {
    // resolve the seeders
    return this.resolveSeeders(seederNameString)
  }

  private parseSeederNames(seederNames: string): string[] {
    return seederNames.length ? seederNames.split(',').map((seederName) => seederName.trim()) : []
  }

  private resolveSeeder(seederClassName: string): ClassConstructor<Seeder> {
    // any seeders configured?
    if (this.options.seeders) {
      // try to find in seeders option
      const seeder = this.options.seeders.find((seeder) => seeder.name === seederClassName)
      // find one?
      if (seeder) {
        // yes, return it
        return seeder
      } else {
        // not good :(
        throw new SeederImportException(
          `Seeder class ${seederClassName} was not found in "seeders" configuration property`,
        )
      }
    } else {
      // not good :(
      throw new SeederImportException(`No seeders have been configured!`)
    }
  }

  private resolveSeeders(seederClassNames: string): ClassConstructor<Seeder>[] {
    // parse the names
    const seederNames = this.parseSeederNames(seederClassNames)
    // try to resolve each one by name
    return seederNames.map((seederName) => {
      return this.resolveSeeder(seederName)
    })
  }
}
