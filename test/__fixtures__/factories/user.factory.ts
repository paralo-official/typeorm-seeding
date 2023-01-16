import { Factory } from '../../../src/factory'
import { User } from '../entities/User.entity'
import { faker } from '@faker-js/faker'

export class UserFactory extends Factory<User> {
  protected options = { entity: User }

  protected async entity(user: User): Promise<User> {
    user.name = faker.name.fullName()
    return user
  }
}
