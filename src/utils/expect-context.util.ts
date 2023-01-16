/**
 * Expect the context to be present and each required context key. Throws an error if that's not the case.
 * @param context the context parameter from a seeding factory definition
 * @param requiredContextKeys all required context keys. can also include an array as an element, specifying similar
 * context keys of which having at least one is required. Example: `["order", "orderId"]` requires at least the
 * `order` or the `orderId` to be present
 */
export function expectContext<T extends Record<string, unknown> = Record<string, unknown>>(
  context: T | undefined,
  ...requiredContextKeys: (keyof T | (keyof T)[])[]
): void {
  if (typeof context !== 'object' || context === null) {
    throw new Error('FactoryWithContext requires context to make the entity')
  }

  contextKeyLoop: for (const contextKey of requiredContextKeys) {
    if (Array.isArray(contextKey)) {
      for (const singleKey of contextKey) {
        if (context?.hasOwnProperty(singleKey)) {
          continue contextKeyLoop
        }
      }

      throw new Error(`Factory requires the ${String(contextKey)} object as context to make the entity`)
    } else {
      if (!context?.hasOwnProperty(contextKey)) {
        throw new Error(`Factory requires the ${String(contextKey)} object as context to make the entity`)
      }
    }
  }
}
