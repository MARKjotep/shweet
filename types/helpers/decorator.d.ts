/**
 * Binds a method to its receiver so the method keeps working after
 * destructuring. Implemented as a standard (TC39) method decorator because the
 * project compiles without `experimentalDecorators`.
 */
export declare function bind<This, Args extends unknown[], Return>(method: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>): void;
