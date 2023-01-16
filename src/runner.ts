import { Seeder } from './seeder'
import { ClassConstructor, ExtractFactory, SeederInstanceOrClass } from './types'
import { SeedingSource } from './seeding-source'
import { resolveSeeders } from './utils/resolve-seeders.util'
import { resolveFactory } from './utils/resolve-factory.util'

/**
 * Runner
 */
export class Runner {
  constructor(readonly seedingSource: SeedingSource) {}

  async all(): Promise<void> {
    return this.many(this.seedingSource.seeders)
  }

  async defaults(): Promise<void> {
    if (this.seedingSource.defaultSeeders) {
      return this.many(this.seedingSource.defaultSeeders)
    }
  }

  async one(seeder: SeederInstanceOrClass): Promise<void> {
    return this.many([seeder])
  }

  async many(seeders: SeederInstanceOrClass[]): Promise<void> {
    const seedersToRun: Seeder[] = resolveSeeders(this.seedingSource, seeders)

    for (const seederToRun of seedersToRun) {
      await seederToRun.run()
    }
  }

  async fromString(classNameString: string): Promise<void> {
    const seeders = this.seedingSource.seedersFromString(classNameString)
    return this.many(seeders)
  }

  /**
   * Return an instance of the factory for the given factory class.
   */
  factory<T>(factory: ClassConstructor<ExtractFactory<T>>): ExtractFactory<T> {
    return resolveFactory(this.seedingSource, factory)
  }
}
