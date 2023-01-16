import { Factory } from '../../../src/factory'
import { FactoryOptions } from '../../../src/types'
import { Pet } from '../entities/Pet.entity'
import { UserFactory } from './user.factory'
import { faker } from '@faker-js/faker'

export class PetFactory extends Factory<Pet> {
  protected options: FactoryOptions<Pet> = { entity: Pet }

  protected async entity(pet: Pet): Promise<Pet> {
    pet.name = faker.name.fullName()
    return pet
  }

  protected async finalize(pet: Pet): Promise<void> {
    if (!pet.owner) {
      pet.owner = await this.factory(UserFactory).create()
    }
  }
}
