import {ClassConstructor, ExtractFactory, SeederInstanceOrClass, SeederOptions, SeederOptionsOverrides} from './types'

import {SeedingSource} from './seeding-source'
import {resolveFactory} from './utils/resolve-factory.util'
import {resolveSeeders} from './utils/resolve-seeders.util'
import {UnwrapSeederInstanceOrClassArray} from "./runner";

/**
 * Seeder
 */
export abstract class Seeder<T = void> {
  /**
   * Options
   */
  protected options: SeederOptions = {}

  /**
   * Constructor
   *
   * @param optionOverrides option overrides
   */
  constructor(private optionOverrides: SeederOptionsOverrides = {}) {
  }

  get seedingSource() {
    if (this.optionOverrides.seedingSource instanceof SeedingSource) {
      return this.optionOverrides.seedingSource
    } else {
      throw new Error(`SeedingSource options was not set for Seeder ${Object.getPrototypeOf(this).constructor.name}`)
    }
  }

  set seedingSource(seedingSource: SeedingSource) {
    this.optionOverrides.seedingSource = seedingSource
  }

  /**
   * Run the seeder logic.
   */
  abstract run(): Promise<T>

  /**
   * Helper method for running sub-seeders.
   *
   * @param seeders Array of seeders to run
   */
  protected async call<T extends SeederInstanceOrClass<any>[] = SeederInstanceOrClass<any>[]>(seeders?: T): Promise<UnwrapSeederInstanceOrClassArray<T>> {
    const seedersToRun = this.seeders(seeders)
    return await this.seedingSource.run.many(seedersToRun) as UnwrapSeederInstanceOrClassArray<T>
  }

  /**
   * Return an instance of the factory for the given factory class.
   */
  factory<T>(factory: ClassConstructor<ExtractFactory<T>>): ExtractFactory<T> {
    return resolveFactory(this.seedingSource, factory, this.optionOverrides.factories)
  }

  /**
   * Return configured seeders.
   *
   * Seeders are NOT merged!
   *
   * Priority is:
   *
   * 1. Seeders passed explicitly
   * 2. Seeders passed as overrides
   * 3. Seeders set as class options
   */
  protected seeders<T = void>(seeders?: SeederInstanceOrClass<T>[]): Seeder[] {
    const whichSeeders = seeders
      ? seeders
      : this.optionOverrides.seeders
        ? this.optionOverrides.seeders
        : this.options.seeders
          ? this.options.seeders
          : []

    return resolveSeeders(this.seedingSource, whichSeeders)
  }
}
