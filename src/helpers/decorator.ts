/**
 * Binds a method to its receiver so the method keeps working after
 * destructuring. Implemented as a standard (TC39) method decorator because the
 * project compiles without `experimentalDecorators`.
 */
export function bind<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
): void {
  const methodName = context.name;

  context.addInitializer(function (this: This) {
    Object.defineProperty(this, methodName, {
      configurable: true,
      enumerable: false,
      get(this: This) {
        const boundMethod = method.bind(this);

        Object.defineProperty(this, methodName, {
          configurable: true,
          writable: true,
          value: boundMethod,
        });

        return boundMethod;
      },
    });
  });
}
