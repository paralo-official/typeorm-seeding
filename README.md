<p align="center">
  <img src="./logo.png" alt="logo" width="160" />
</p>
<h1 align="center" style="text-align: center;">TypeORM Seeding with context</h1>

<p align="center">
  <img alt="NPM" src="https://img.shields.io/npm/l/@concepta/typeorm-seeding?style=for-the-badge">
  <a href="https://www.npmjs.com/package/@concepta/typeorm-seeding">
    <img alt="NPM latest version" src="https://img.shields.io/npm/v/@concepta/typeorm-seeding/latest?style=for-the-badge">
  </a>
</p>

<p align="center">
  <b>A simple but powerful database seeder for TypeORM ^0.3.11</b></br>
</p>

<p align="center">
  <sub>A <a href="https://github.com/conceptadev">Concepta</a> Fork of <a href="https://github.com/w3tecch/typeorm-seeding">TypeORM Seeding</a></sub>
</p>

<p align="center">
  <sub>Originally authored and maintained by <a href="https://github.com/hirsch88">Gery Hirschfeld</a>,
  <a href="https://github.com/jorgebodega">Jorge Bodega</a> and
  <a href="https://github.com/w3tecch/typeorm-seeding/graphs/contributors">Contributors</a></sub>
</p>

<br />

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Factory](#factory-class)
- [Seeder](#seeder-class)
- [Command Line Tool](#cli)
- [Unit Testing API](#unit-testing)

## Introduction

Creating sample data for your TypeORM project entities is exhausting 🥵

The TypeORM seeding module's goal is to make this task fun and rewarding.

How does it work? Just create your entity factories and/or seeders, and run the CLI command!

#### Entities

```typescript
@Entity()
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  lastname: string
}
```

#### Factories

```typescript
class UserFactory extends Factory<User> {
  protected async entity(): Promise<User> {
    const user = new User()
    user.name = 'John'
    user.lastname = 'Doe'
    return user
  }
}
```

#### Seeders

```typescript
export class UserSeeder extends Seeder {
  async run() {
    await this.factory(UserFactory).create()
  }
}
```

#### Run It!

```
typeorm-seeding seed -c seeding-source.js
```

## Installation

This module requires TypeORM 0.3.0 and higher.

Please read the [TypeORM Getting Started](https://typeorm.io/#/) documentation. This explains how to setup a TypeORM project.

Install the package with `npm` or `yarn`. Add the development flag if you are not using seeders and/or factories in production code.

> The [Faker](https://www.npmjs.com/package/@faker-js/faker) package was previously a dependency of the project,
> but now it is optional. If you want to use faker, you will need to install and import it.

```
npm i [-D] @concepta/typeorm-seeding @faker-js/faker
yarn add [-D] @concepta/typeorm-seeding @faker-js/faker
```

## Configuration

The heart of the module is the `SeedingSource` class.

You must create an instance and provide it to the CLI via configuration file,
or pass it directly to your `Seeder` and `Factory` constructors.

### Seeding Source Class

```typescript
class SeedingSource {
  constructor(options: SeedingSourceOptions)
}
```

### Seeding Source Options

The `SeedingSource` instance is configured with a [TypeORM DataSource](https://typeorm.io/data-source) instance (or options to create an instance),
a list of `Seeder` classes, and optionally a list of default `Seeder` classes.

```typescript
interface SeedingSourceOptions {
  // data source instance, or options for creating a data source instance
  dataSource: DataSource | DataSourceOptions
  // all of your seeder classes, REQUIRED for CLI
  seeders?: ClassConstructor<Seeder>[]
  // default seeders (if provided, only these will be run by the CLI)
  defaultSeeders?: ClassConstructor<Seeder>[]
}
```

### Data Source Instance

The `DataSource` config can be defined directly in the seeding source module, or imported from a different module.
Since most developers have this in it's own file, our example will follow this standard.

```javascript
const { DataSource } = require('typeorm')
const { User, Pet } = require('./my-module')

module.exports = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Pet],
})
```

### Seeding Source Instance

We import the above `DataSource` and our seeders from `my-module`.

```javascript
const { SeedingSource } = require('@concepta/typeorm-seeding')
const { AppSeeder, UserSeeder, PetSeeder, dataSource } = require('./my-module')

module.exports = new SeedingSource({
  dataSource, // overridden if provided by CLI arg
  seeders: [UserSeeder, PetSeeder],
})
```

## Factory Class

Factory is how we provide a way to simplify entities creation, implementing a
[factory creational pattern](https://refactoring.guru/design-patterns/factory-method).
It is defined as an abstract class with generic typing, so you have to extend it.

> Note: It is possible to create more than one `Factory` related to the same entity class.

```typescript
class UserFactory extends Factory<User> {
  // required
  protected async entity(): Promise<User> {
    const user = new User()
    user.name = 'John'
    user.lastname = 'Doe'
    return user
  }

  // optional
  protected async finalize(user: User): Promise<void> {
    // last chance to mutate the entity at end of factory lifecycle
  }
}
```

### `entity`

This method must be overridden to define how the entity is generated.
It is called to instantiate the entity and the result will be used for the rest of factory lifecycle.

#### Basic Implementation

In the most basic implementation, the factory is responsible for creating the new entity instance.

```typescript
class UserFactory extends Factory<User> {
  protected async entity(): Promise<User> {
    const user = new User()
    user.name = 'John'
    user.lastname = 'Doe'
    return user
  }
}
```

#### Advanced Implementation

If you configure the entity option, then the method receives a new instance of that entity class.

> This factory is now eligible for entity overrides.

```typescript
class UserFactory extends Factory<User> {
  protected options = {
    entity: User,
  }

  protected async entity(user: User): Promise<User> {
    user.name = 'John'
    user.lastname = 'Doe'
    return user
  }
}
```

### `finalize`

This method can be overridden to customize how the entity is finalized.
It is called at the end of the entity generation lifecycle,
giving one last opportunity to set defaults or perform data validation, etc.

```typescript
protected async finalize(pet: Pet): Promise<void> {
  if (!pet.owner) {
    pet.owner = await this.factory(UserFactory).create()
  }
}
```

## Factory Usage

### `make`

The `make()` method executes the factory lifecycle and returns a new instance of the given entity.

The instance is filled with the generated values from the factory lifecycle, **but not saved in the database**.

> Important: You must pass the entity to the factory's `save()` method to persist the entity if desired.

```typescript
make(overrideParams: Partial<Entity> = {}): Promise<Entity>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    // get a user factory
    const userFactory = this.factory(UserFactory)
    // using defaults
    const user = userFactory.make()
    // with email override
    const user2 = userFactory.make({ email: 'other@mail.com' })
    // persist to database (optional)
    await userFactory.save([user, user2])
  }
}
```

### `makeMany`

The `makeMany()` method executes the factory lifecycle and returns many new instances of the given entity.

Each instance is filled with the generated values from the factory lifecycle, **but not saved in the database**.

> Important: You must pass the entities to the factory's `save()` method to persist the entities if desired.

```typescript
makeMany(amount: number, overrideParams: Partial<Entity> = {}): Promise<Entity>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    // get a user factory
    const userFactory = this.factory(UserFactory)
    // using defaults
    const users = userFactory.makeMany(10)
    // with email override
    const users2 = userFactory.makeMany(10, { email: 'other@mail.com' })
    // persist to database (optional)
    await userFactory.save(users)
    await userFactory.save(users2)
  }
}
```

### `create`

The `create()` method is similar to the `make()` method,
but at the end the generated entity instance gets persisted in
the database using the TypeORM entity manager.

```typescript
create(overrideParams: Partial<Entity> = {}, saveOptions?: SaveOptions): Promise<Entity>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    // get a user factory
    const userFactory = this.factory(UserFactory)
    // using default
    await userFactory.create()
    // override the email
    await userFactory.create({ email: 'other@mail.com' })
    // using save options
    await userFactory.create({ email: 'other@mail.com' }, { listeners: false })
  }
}
```

### `createMany`

The `createMany()` methods is similar to the `makeMany()` method,
but at the end the generated entity instances gets persisted in
the database using the TypeORM entity manager.

```typescript
createMany(amount: number, overrideParams: Partial<Entity> = {}, saveOptions?: SaveOptions): Promise<Entity>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    // get a user factory
    const userFactory = this.factory(UserFactory)
    // using default
    await userFactory.createMany(10)
    // override the email
    await userFactory.createMany(10, { email: 'other@mail.com' })
    // using save options
    await userFactory.createMany(10, { email: 'other@mail.com' }, { listeners: false })
  }
}
```

### `map`

Use the `.map()` function to alter the generated value for each entity.

This is especially useful for setting different data for each generated entity with `makeMany()` and `createMany()`,
compared to `overrideParams` which sets the same data for all generated entities.

```typescript
map(mapFunction: (entity: Entity) => void): Factory
```

```typescript
import { faker } from '@faker-js/faker'

export class UserSeeder extends Seeder {
  async run() {
    await this.factory(UserFactory)
      .map((user) => {
        user.favoriteColor = faker.color.human()
      })
      .createMany(10)
  }
}
```

### `factory`

Use the `.factory()` utility method to get an instance of a `Factory` class dependency.

This is the recommended way to obtain a factory instance,
as it automatically sets the seeding source,
as well as supports the factory overrides api.

> The seeding source of the calling Factory is automatically set on the new factory.

```typescript
factory<T>(factory: ClassConstructor<ExtractFactory<T>>): ExtractFactory<T>
```

```typescript
class UserFactory extends Factory<User> {
  protected options = {
    entity: User,
  }

  protected async entity(user: User): Promise<User> {
    user.name = 'John'
    user.lastname = 'Doe'
    user.pet = await this.factory(PetFactory).create()
    return user
  }
}
```

### `save`

Use the `.save()` utility method to persist entities to the database, that were not automatically persisted.

```typescript
async save(entity: Entity, saveOptions?: SaveOptions): Promise<Entity>
async save(entities: Entity[], saveOptions?: SaveOptions): Promise<Entity[]>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    const userFactory = this.factory(UserFactory)
    const user = await userFactory.make()
    await userFactory.save(user)
  }
}
```

### Lifecycle Steps

The complete factory lifecycle is explained in the following table.

| Priority | Step             |                                                                                         |
| -------- | ---------------- | --------------------------------------------------------------------------------------- |
| 1        | `map()`          | Entity is passed to map function (if provided)                                          |
| 2        | `paramOverrides` | Param overrides passed to `make()`, `makeMany()`,`create()`, `createMany()` are applied |
| 3        | `Promises`       | Entity attributes which are promises are resolved                                       |
| 4        | `Factories`      | Entity attributes which are factory instances are executed (`.make()` or `.create()`).  |
| 5        | `finalize()`     | Entity is passed to finalize. No further processing is done after this.                 |

## Seeder Class

The Seeder class provides a way to orchestrate the use of factories to insert data into the database.

It is an abstract class with one method to be implemented: `run()`.

> **Note:** Seeder classes are required for seeding from the CLI.
> However, you can create your own seeding scripts using only Factory classes.

```typescript
class UserSeeder extends Seeder {
  async run() {
    // use factories to generate and persist entities
    await this.factory(UserFactory).createMany(10)
  }
}
```

### `run`

This function must be defined when extending the class.

```typescript
run(): Promise<void>
```

```typescript
async run() {
    await this.factory(UserFactory).createMany(10)
}
```

## Seeder Usage

### `factory`

Use the `.factory()` utility method to get an instance of a `Factory` class.

This is the recommended way to obtain a factory instance,
as it automatically sets the seeding source,
as well as supports the factory overrides api.

> The seeding source of the calling Seeder is automatically set on the returned factory.

```typescript
factory<T>(factory: ClassConstructor<ExtractFactory<T>>): ExtractFactory<T>
```

```typescript
export class UserSeeder extends Seeder {
  async run() {
    const userFactory = this.factory(UserFactory)
    await userFactory.create()
  }
}
```

### `call`

This method enables you to create a tree structure of seeders.

```typescript
protected async call(seeders?: SeederInstanceOrClass[]): Promise<void>
```

Call one or more seeders explicitly.

```typescript
export class UserSeeder extends Seeder {
  async run() {
    await this.factory(UserFactory).createMany(10)
    await this.call([PetSeeder])
  }
}
```

Call one or more seeders via options.

> This seeder is now eligible for seeder overrides.

```typescript
export class UserSeeder extends Seeder {
  protected options: {
    seeders: [PetSeeder]
  }

  async run() {
    await this.factory(UserFactory).createMany(10)
    await this.call()
  }
}
```

> If your seeders use a tree structure, you can use the `defaultSeeders` option to determine the entry point(s) of your seeder tree(s)

<p align="center">
  <img src="./seeders.png" alt="logo" />
</p>

## CLI

There are two possible commands to execute, one to see the current configuration and one to run seeders.

Add the following scripts to your `package.json` file to configure them.

```json
"scripts": {
  "seed:config": "typeorm-seeding config -r ./dist -c seeding-source.js",
  "seed:run": "typeorm-seeding seed -r ./dist -c seeding-source.js",
}
```

### `config`

This command prints the seeder configuration.

```bash
typeorm-seeding config
```

Example result

```
{
  seeders: [ [class User], [class Pet] ],
  defaultSeeders: [ [class AppSeeder] ],
  dataSource: [ [class DataSource] ]
}
```

##### Options

| Option                    | Default         | Description                                      |
| ------------------------- | --------------- | ------------------------------------------------ |
| `--root` or `-r`          | `process.cwd()` | Path to the project root                         |
| `--seedingSource` or `-c` |                 | Relative path to the seeding config from `root`. |

### `seed`

This command executes your seeder(s).

```bash
typeorm-seeding seed
```

##### Options

| Option                    | Default         | Description                                                |
| ------------------------- | --------------- | ---------------------------------------------------------- |
| `--root` or `-r`          | `process.cwd()` | Path to the project root                                   |
| `--seedingSource` or `-c` |                 | Relative path to the seeding config from `root`.           |
| `--dataSource` or `-d`    |                 | Relative path to TypeORM data source config from `root`.   |
| `--seed` or `-s`          |                 | One or more specific seeder class(es) to run individually. |

## Unit Testing

The unit testing features allow you to use Factories and Seeders completely independently of the CLI.

SeedingSources and DataSources can be instanitated at run time and directly injected into Factories and Seeders.

Additionally, you can override Factory and Seeder dependencies via class and constructor options.

### Runner Class

To seed your unit tests with Seeders, a `Runner` class instance is provided on `SeedingSource`.

To run one or more seeders with one command, use the `SeedingSource.run` instance.

#### `SeedingSource.run.all`

Execute all seeders.

```typescript
SeedingSource.run.all(): Promise<void>
```

#### `SeedingSource.run.one`

Execute one seeder.

```typescript
SeedingSource.run.one(
  seeder: SeederInstanceOrClass,
): Promise<void>
```

#### `SeedingSource.run.many`

Execute many seeders.

```typescript
SeedingSource.run.many(
  seeders: SeederInstanceOrClass[],
): Promise<void>
```

#### `SeedingSource.run.defaults`

Execute all default seeders.

```typescript
SeedingSource.run.defaults(): Promise<void>
```

### Factories

Factories can be used stand alone if you explicitly pass a SeedingSource instance option to the constructor.

```typescript
import { seedingSource } from './my-module'

const factory = new UserFactory({ seedingSource })
const user = await factory.create()
```

If a factory gets a `Factory` dependency with the `factory()` method, you can override it using the overrides api.

```typescript
import { faker } from '@faker-js/faker'
import { seedingSource } from './my-module'

class UserFactory extends Factory<User> {
  protected options = {
    entity: User,
  }

  protected async entity(user: User): Promise<User> {
    user.name = 'John'
    user.lastname = 'Doe'
    user.pet = await this.factory(PetFactory).create()
    return user
  }
}

class PetFactory2 extends Factory<Pet> {
  protected options = {
    entity: Pet,
    override: PetFactory,
  }

  async entity(pet: Pet) {
    pet.color = faker.color.human()
    return pet
  }
}

const factory = new UserFactory({
  seedingSource,
  factories: [new PetFactory2()],
})

// PetFactory2 is used to generate Pet entities
const user = await factory.create()
```

All `Factory` overrides are supported via the constructor for just-in-time operations.

```typescript
constructor(optionOverrides?: FactoryOptionsOverrides<Entity, Context>);
```

```typescript
interface FactoryOptionsOverrides<Entity, Context, SF = any> {
  entity?: ClassConstructor<Entity>
  requiredContextKeys?: (keyof Context | (keyof Context)[])[]
  factories?: ExtractFactory<SF>[]
  override?: ClassConstructor<Factory<any>>
  seedingSource?: SeedingSource
}
```

### Seeders

Seeders can be used stand alone if you explicitly pass a SeedingSource instance option to the constructor.

```typescript
import { seedingSource } from './my-module'

const userSeeder = new UserSeeder({ seedingSource })
await userSeeder.run()
```

If a seeder gets a `Factory` dependency with the `factory()` method, you can override it using the overrides api.

```typescript
import { faker } from '@faker-js/faker'
import { seedingSource } from './my-module'

export class UserSeeder extends Seeder {
  async run() {
    await this.factory(UserFactory).createMany(10)
  }
}

class UserFactory2 extends Factory<User> {
  protected options = {
    entity: User,
    override: UserFactory,
  }

  async entity(user: User) {
    user.favoriteColor = faker.color.human()
    return user
  }
}

const userSeeder = new UserSeeder({
  seedingSource,
  factories: [new UserFactory2()],
})

// UserFactory2 is used to generate User entities
await userSeeder.run()
```

If a seeder has the seeders options set, you can override them using the overrides api.

> Important: When you override seeders, the entire list of seeders options is replaced, NOT merged.

```typescript
import { faker } from '@faker-js/faker'
import { seedingSource } from './my-module'

export class UserSeeder extends Seeder {
  protected options: {
    seeders: [PetSeeder, FoodSeeder]
  }

  async run() {
    await this.factory(UserFactory).createMany(10)
    await this.call()
  }
}

export class PetSeederOverride extends Seeder {
  async run() {
    await this.factory(PetFactory)
      .map((pet) => {
        pet.color = faker.color.human()
      })
      .createMany(20)
  }
}

const userSeeder = new UserSeeder({
  seedingSource,
  seeders: [PetSeederOverride],
})

// UserSeeder and PetSeederOverride are executed, FoodSeeder is NOT
await userSeeder.run()
```

All `Seeder` overrides are supported via the constructor for just-in-time operations.

```typescript
constructor(optionOverrides?: SeederOptionsOverrides);
```

```typescript
interface SeederOptionsOverrides<SF = any> {
  seeders?: SeederInstanceOrClass[]
  factories?: ExtractFactory<SF>[]
  seedingSource?: SeedingSource
}
```
