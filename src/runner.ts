import {Seeder} from './seeder'
import {ClassConstructor, ExtractFactory, SeederInstanceOrClass} from './types'
import {SeedingSource} from './seeding-source'
import {resolveSeeders} from './utils/resolve-seeders.util'
import {resolveFactory} from './utils/resolve-factory.util'

export type SeederInstanceOrClassReturnValue<S extends SeederInstanceOrClass<any>> = S extends SeederInstanceOrClass<infer T> ? T : void;
export type UnwrapSeederInstanceOrClassArray<T> = {
  [K in keyof T]: T[K] extends SeederInstanceOrClass<infer O> ? O : T[K];
}

/**
 * Runner
 */
export class Runner {
  constructor(readonly seedingSource: SeedingSource) {
  }

  async all<T extends any[]>(): Promise<T | void> {
    return await this.many(this.seedingSource.seeders) as T
  }

  async defaults<T extends any[]>(): Promise<T | void> {
    if (this.seedingSource.defaultSeeders) {
      return await this.many(this.seedingSource.defaultSeeders) as T
    }
  }

  async one<S extends SeederInstanceOrClass<any>>(seeder: S): Promise<SeederInstanceOrClassReturnValue<S>> {
    return (await this.many([seeder]))[0] as SeederInstanceOrClassReturnValue<S>;
  }

  async many<T extends SeederInstanceOrClass<any>[] = SeederInstanceOrClass<void>[]>(seeders: T): Promise<UnwrapSeederInstanceOrClassArray<T>> {
    const seedersToRun: Seeder[] = resolveSeeders(this.seedingSource, seeders)
    const seederReturnValues: unknown[] = []

    for (const seederToRun of seedersToRun) {
      seederReturnValues.push(await seederToRun.run())
    }

    return seederReturnValues as unknown as UnwrapSeederInstanceOrClassArray<T>
  }

  async fromString<T extends any[]>(classNameString: string): Promise<T | void> {
    const seeders = this.seedingSource.seedersFromString(classNameString)
    return (await this.many(seeders)) as T
  }

  /**
   * Return an instance of the factory for the given factory class.
   */
  factory<T>(factory: ClassConstructor<ExtractFactory<T>>): ExtractFactory<T> {
    return resolveFactory(this.seedingSource, factory)
  }
}
