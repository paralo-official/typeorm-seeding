import type { DataSource, DataSourceOptions } from 'typeorm'

import { Factory } from './factory'
import { Seeder } from './seeder'
import { SeedingSource } from './seeding-source'

export type ClassConstructor<T> = new (...args: any[]) => T

export type InstanceOrClass<T = any> = T | ClassConstructor<T>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ExtractFactory<F> = F extends Factory<infer E, infer C> ? F : never

export type FactoryInstanceOrClass<T> = InstanceOrClass<Factory<T>>

export type SeederInstanceOrClass = InstanceOrClass<Seeder>

export interface SeederOptions {
  seeders?: SeederInstanceOrClass[]
}

export interface SeederOptionsOverrides<SF = any> {
  seeders?: SeederInstanceOrClass[]
  factories?: ExtractFactory<SF>[]
  seedingSource?: SeedingSource
}

export interface FactoryOptions<Entity, Context extends Record<string, unknown> = Record<string, unknown>> {
  entity?: ClassConstructor<Entity>
  /**
   * All required context keys. Can also include an array as an element, specifying similar
   * context keys of which having at least one is required. Example: `["order", "orderId"]` requires at least the
   * `order` or the `orderId` to be present.
   */
  requiredContextKeys?: (keyof Context | (keyof Context)[])[]
  override?: ClassConstructor<Factory<any>>
}

export interface FactoryOptionsOverrides<
  Entity,
  Context extends Record<string, unknown> = Record<string, unknown>,
  SF = any,
> extends FactoryOptions<Entity, Context> {
  factories?: ExtractFactory<SF>[]
  seedingSource?: SeedingSource
}

export interface SeedingSourceOptions {
  dataSource: DataSource | DataSourceOptions
  seeders?: ClassConstructor<Seeder>[]
  defaultSeeders?: ClassConstructor<Seeder>[]
}
