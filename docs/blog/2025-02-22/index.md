---
slug: error-handling-fundamentals
title: Error Handling Fundamentals
authors: [GurovDmitriy, ElenaErokhina]
tags: [ErrorHandling, RxJS, Inversify, React, Angular]
---

![mib-interview](/img/blog/mib-interview.jpg)

Error handling is a tricky task, frameworks provide basic solutions, but they rarely cover all scenarios.
Errors come in various forms, and the handling logic is often duplicated and scattered throughout the code.
To bring order to this process, a lot of code has to be written manually. <!-- truncate -->

In this article, we will explore an approach that helps organize error handling and make it scalable.
It can be adapted to your own project, so you don’t have to worry about an unhandled exception breaking your application.

The examples will use [RxJS](https://rxjs.dev/), [Inversify](https://inversify.io/), and React, but the principles can be applied to other tech stacks as well.

## Key Ideas

As a result, our system will:

- catch unhandled exceptions, network errors, and other failures
- forward them to an error service
- map them into a unified format and store them in a ready-to-use form
- react accordingly — for example, by showing notifications or sending information to monitoring systems

Now, let’s move on to the implementation.

## Interfaces

To make the material easier to understand, we will omit detailed typing but define the key contracts.

### Base interface

All errors will have:

- a status to determine the category (e.g., 4xx/5xx)
- a code as an identifier for analysis (e.g., mapped/http/not_found)
- a message for displaying in the user interface

```ts title="src/core/error/types.ts"
export interface ErrorCustom {
  status: number
  code: string
  message: string
}
```

### Standard Type

`ErrorMapped` is an interface to which errors are mapped after processing.
It extends `ErrorCustom` and contains the original error for debugging or analysis.

```ts title="src/core/error/types.ts"
export interface ErrorMapped extends ErrorCustom {
  original: any
}
```

### Additional Types

As an example, we will implement `ErrorSchema` — an interface for a category of errors related to backend response validation.
It will include an `issues` property containing details of the validation errors.

```ts title="src/core/error/types.ts"
export interface ErrorSchema extends ErrorCustom {
  issues: any
}
```

In real projects, there can be several such layers, and for each layer you can create your own error types by analogy
with `ErrorSchema`: for example, ErrorAuth for authorization errors or `ErrorNetwork` for network-related issues.

### Parameters for Creating Errors

Parameter contracts define what the error implementations will accept. They mirror the base types:

```ts title="src/core/error/types.ts"
export interface ErrorParams {
  status: number
  code: string
  message: string
}

export interface ErrorMappedParams extends ErrorParams {
  original: any
}

export interface ErrorSchemaParams extends ErrorParams {
  issues: any
}
```

### Error Factory

To ensure consistent error creation rules, we introduce the `ErrorFactory` interface.
The factory will accept the parameters we defined in the previous step and create an error of the required type.

```ts title="src/core/error/types.ts"
export interface ErrorFactory<TParams = any, TError = any> {
  create(params: TParams): TError
}
```

### Error Mapper

In the domains layer, there should be a class similar to the `Adapter` pattern that 
converts all errors to the `ErrorMapped` type.

```ts title="src/core/error/types.ts"
export interface ErrorMapper {
  handle(error: any): ErrorMapped
}
```

### Error Service

Finally, let's define the error service. At its core is the `Observer` pattern — it allows all interested modules to track errors.
In our case, we will base it on reactive streams using [RxJS](https://rxjs.dev/):

```ts title="src/core/error/types.ts"
import { Observable } from "rxjs"

export interface ErrorService {
  error$: Observable<ErrorMapped | null>
  handle(error: any): ErrorMapped
}
```

### Summary

The application introduces rules that modules above the core layer must follow.
This is necessary to unify the handling of different types of errors.
All exotic errors, such as `AxiosError` or errors from third-party libraries, should pass through the `ErrorMapper`.
You can create adapters that, at the `HTTP` layer, convert third-party errors into our own via the `ErrorFactory`.
This way, we can control such errors from the core layer of the application.

## Classes

If interfaces define the contract, then classes implement the logic based on these contracts.

### Custom Error

`ErrorBase` is the base implementation of custom errors in the project.

```ts title="src/core/error/ErrorBase.ts"
import { ErrorCustom, ErrorParams } from "./types"

export class ErrorBase implements ErrorCustom {
  status: number
  code: string
  message: string

  constructor(params: ErrorParams) {
    this.status = params.status
    this.code = params.code
    this.message = params.message
  }
}
```

### Error with Call Stack

`ErrorHeavy` extends the standard `Error` class and implements the `ErrorCustom` interface.
It is intended for errors where preserving the call stack is important.

```ts title="src/core/error/ErrorHeavy.ts"
import { ErrorCustom, ErrorParams } from "./types"

export class ErrorHeavy extends Error implements ErrorCustom {
  status: number
  code: string

  constructor(params: ErrorParams) {
    super(params.message)

    this.status = params.status
    this.code = params.code

    this.name = this.constructor.name

    if ((Error as any).captureStackTrace) {
      ;(Error as any).captureStackTrace(this, this.constructor)
    }
  }
}
```

### Error for the response validation

`ErrorSchemaBase` is used for errors thrown in the `HTTP` layer when validating the backend response schema.

```ts title="src/core/error/ErrorSchemaBase.ts"
import { ErrorBase } from "./error-base"
import { ErrorSchema, ErrorSchemaParams } from "./types"

export class ErrorSchemaBase extends ErrorBase implements ErrorSchema {
  issues: any

  constructor(params: ErrorSchemaParams) {
    super(params)

    this.issues = params.issues
  }
}
```

### Adapter Error Class

`ErrorMappedBase` represents an error after its original has been processed by the mapper.

```ts title="src/core/error/ErrorMappedBase.ts"
import { ErrorBase } from "./error-base"
import type { ErrorMapped, ErrorMappedParams } from "./types"

export class ErrorMappedBase extends ErrorBase implements ErrorMapped {
  original: any

  constructor(params: ErrorMappedParams) {
    super(params)

    this.original = params.original
  }
}
```

### Summary

We have designed a class system that adheres to our contracts and is flexibly extensible — from the base class ErrorBase to
specific implementations like `ErrorSchemaBase`.
For errors where it is important to preserve the original information after mapping, we introduced the
`ErrorHeavy` class — useful for detailed debugging.
`ErrorMappedBase` is the final "unified" class for third-party errors.
This separation allows for flexible and consistent error handling at different levels of the application,
ensuring ease of processing, logging, and displaying errors.

## Factories

To systematize the error creation process, we will create a set of factories.
All of them will implement the `ErrorFactory` interface — this ensures that the error creation process is consistent throughout the system.
Each factory will be responsible for producing its own types of errors:

```ts title="src/core/error/ErrorBaseFactory.ts"
import { injectable } from "inversify"
import { ErrorBase } from "./error-base"
import type { ErrorFactory, ErrorParams } from "./types"

@injectable()
export class ErrorBaseFactory implements ErrorFactory<ErrorParams, ErrorBase> {
  create(params: ErrorParams): ErrorBase {
    return new ErrorBase(params)
  }
}
```

```ts title="src/core/error/ErrorHeavyFactory.ts"
import { injectable } from "inversify"
import { ErrorHeavy } from "./error-heavy"
import type { ErrorFactory, ErrorParams } from "./types"

@injectable()
export class ErrorHeavyFactory
  implements ErrorFactory<ErrorParams, ErrorHeavy>
{
  create(params: ErrorParams): ErrorHeavy {
    return new ErrorHeavy(params)
  }
}
```

```ts title="src/core/error/ErrorHeavyFactory.ts"
import { injectable } from "inversify"
import { ErrorSchemaBase } from "./error-schema-base"
import type { ErrorFactory, ErrorSchema, ErrorSchemaParams } from "./types"

@injectable()
export class ErrorSchemaBaseFactory
  implements ErrorFactory<ErrorSchemaParams, ErrorSchema>
{
  create(params: ErrorSchemaParams): ErrorSchema {
    return new ErrorSchemaBase(params)
  }
}
```

```ts title="src/core/error/ErrorMappedBaseFactory.ts"
import { injectable } from "inversify"
import { ErrorMappedBase } from "./error-mapped-base"
import type { ErrorFactory, ErrorMapped, ErrorMappedParams } from "./types"

@injectable()
export class ErrorMappedBaseFactory
  implements ErrorFactory<ErrorMappedParams, ErrorMapped>
{
  create(params: ErrorMappedParams): ErrorMapped {
    return new ErrorMappedBase(params)
  }
}
```

```ts title="src/core/error/ErrorMappedBaseFactory.ts"
import { injectable } from "inversify"
import { ErrorMappedBase } from "./error-mapped-base"
import type { ErrorFactory, ErrorMapped, ErrorMappedParams } from "./types"

@injectable()
export class ErrorMappedBaseFactory
  implements ErrorFactory<ErrorMappedParams, ErrorMapped>
{
  create(params: ErrorMappedParams): ErrorMapped {
    return new ErrorMappedBase(params)
  }
}
```

### Summary

The logic for handling different types of errors can evolve in various directions,
so it’s best to avoid excessive generalization through a single universal factory.
Creating separate factories for each error type helps maintain clarity and flexibility,
simplifying the maintenance and extension of the error handling system.

## ErrorService

`ErrorServiceDefault` is the main module for error mapping and notifying interested components of the application.

```ts title="src/core/error/ErrorServiceDefault.ts"
import { injectable, inject } from "inversify"
import { BehaviorSubject } from "rxjs"
import { ErrorMappedBase } from "./error-mapped-base"
import { TOKEN_ERROR_MAPPER } from "./token"
import type { ErrorMapped, ErrorMapper, ErrorService } from "./types"

@injectable()
export class ErrorServiceDefault implements ErrorService {
  private errorSubject = new BehaviorSubject<ErrorMapped | null>(null)
  error$ = this.errorSubject.asObservable()

  constructor(@inject(TOKEN_ERROR_MAPPER) private errorMapper: ErrorMapper) {}

  handle(error: any): ErrorMapped {
    if (error === this.errorSubject.getValue()) {
      return error
    }

    if (error instanceof ErrorMappedBase) {
      this.errorSubject.next(error)
      return error
    }

    const errorMapped = this.errorMapper.handle(error)
    this.errorSubject.next(errorMapped)

    return errorMapped
  }
}
```

### Summary

A unified service allows centralized management and unification of errors.
Interested modules only need to subscribe to the error stream in the service and respond promptly to errors in the system.

## Integration

For each framework or environment, additional handlers or integration with existing tools may be required.
Integration helps adapt the system to the specifics of the frameworks, intercept errors at all levels,
and maintain a unified approach to error handling throughout the application ecosystem.

### Global Error Catcher

The main goal of the module is to start forwarding errors from the top level of the application to the error service.
In `React`, this can be the `useErrorHandler` function, which sets listeners on `window.onerror` and `window.onunhandledrejection` events.
In `Angular`, it can be an extended error handling class.

```ts title="src/core/error/useErrorHandler.ts"
import { injectForFn } from "@/composition/container/AppInject"
import { TOKEN_ERROR_SERVICE } from "@/core/Error/token"
import { useEffect } from "react"
import type { ErrorBaseFactory, ErrorService } from "./types"

interface Props {
  errorService: ErrorService
  errorFactory: ErrorFactory
}

export const useErrorHandler = injectForFn({
  errorService: TOKEN_ERROR_SERVICE,
  errorFactory: ErrorBaseFactory,
})(useErrorHandlerPrivate)

export function useErrorHandlerPrivate({ errorService, errorFactory }: Props) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.onerror = () => {
        errorService.handle(
          errorFactory.create({
            status: 0,
            code: "window/onerror",
            message: "Unknown error",
          }),
        )
        return true
      }

      window.onunhandledrejection = () => {
        errorService.handle(
          errorFactory.create({
            status: 0,
            code: "window/onerror",
            message: "Unknown error",
          }),
        )
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.onerror = null
        window.onunhandledrejection = null
      }
    }
  }, [errorService])
}
```

### Handling Patterns

In `React`, it is common to create an error handling component by extending `Component`. We will call
it `ErrorBoundaryReact` — following the pattern it implements.
`ErrorBoundaryReact` will catch errors in child components.
It is a universal wrapper — later, we will use it in one of our own providers.

```tsx title="src/core/error/ErrorBoundaryReact.tsx"
import { Component, PropsWithChildren } from "react"

export class ErrorBoundaryReact extends Component<
  { onError: (error: Error) => void } & PropsWithChildren,
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)

    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}
```

### Summary

Different environments may have layers that require integration with the error handling system.
However, this does not prevent connecting it similarly to `useErrorHandler` or `ErrorBoundaryReact`.
For example, in `Next.js`, you can integrate our service into the `error-global.tsx`, `error.tsx`, and `not-found.tsx` pages so
they pass error information to it.
You can use these tools while configuring additional handlers to meet the requirements of your environment.

## Container

### Tokens

We complete the error system architecture by configuring the `IoC` container
using [Inversify](https://inversify.io/) — a powerful dependency management tool. You can learn more about its setup for `React` in [this](/blog/inversion-of-control) article.
For the container, we will define two tokens to enable flexible configuration of dependencies in the future.

```ts title="src/core/error/token.ts"
export const TOKEN_ERROR_SERVICE = Symbol.for("app.service ErrorService")
export const TOKEN_ERROR_MAPPER = Symbol.for("app.service ErrorMapper")
```

### Configure Modules

```ts title="src/composition/container/container.ts"
import {
  ErrorMapper,
  ErrorService,
  TOKEN_ERROR_MAPPER,
  TOKEN_ERROR_SERVICE,
} from "@/core/Error"

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container
  .bind<ErrorService>(TOKEN_ERROR_SERVICE)
  .to(ErrorServiceDefault)
  .inSingletonScope()

container
  .bind<ErrorMapper>(TOKEN_ERROR_MAPPER)
  .to(ErrorMapperDefault)
  .inSingletonScope()

export { container }
```

### Summary

The example above demonstrates a basic approach to configuring the dependency container.
In real projects, the configuration and replacement of modules in the container can be significantly
more complex and may include additional layers of abstraction, conditions, and settings.

## Domains Error

### ErrorMapper implementation

We have come to creating a specific error mapper. The project may have several types of such mappers.

```ts title="src/domains/error/ErrorMapperCustom.ts"
import { injectable } from "inversify"
import { AxiosError } from "axios"
import {
  ErrorMappedBaseFactory,
  ErrorSchemaBase,
  type ErrorMapped,
  type ErrorMapper,
} from "../../core/error"

@injectable()
export class ErrorMapperCustom implements ErrorMapper {
  constructor(private errorFactory: ErrorMappedBaseFactory) {}

  handle(error: any): ErrorMapped {
    if (error instanceof AxiosError) {
      if (error.status === 404) {
        return this.errorFactory.create({
          status: error.status,
          code: "app/error_mapped/http/not_found",
          message: "Not found",
          original: error,
        })
      }

      return this.errorFactory.create({
        status: error.status,
        code: "app/error_mapped/http/unknown",
        message: "Unknown error",
        original: error,
      })
    }

    if (error instanceof ErrorSchemaBase) {
      if ((error as any).issues) {
        return this.errorFactory.create({
          status: error.status,
          code: "app/error_mapped/schema/schema_not_valid",
          message: "Error response schema",
          original: error,
        })
      }

      return this.errorFactory.create({
        status: error.status,
        code: "app/error_mapped/schema/schema_not_valid",
        message: "Unknown error response schema",
        original: error,
      })
    }

    return this.errorFactory.create({
      status: 0,
      code: "app/error_mapped/unknown",
      message: "Unknown error",
      original: error,
    })
  }
}
```

### Global Error Pages Service

If you want to hide the component tree and display a global fallback error page for certain
types of errors, you will need an `ErrorBoundaryProvider`. This component acts as a context and uses the
previously configured `ErrorBoundaryReact`.
We subscribe to the error service and track the relevant error types in order to show the error page accordingly.

```tsx title="src/domains/error/ErrorBoundaryProvider.tsx"
import { injectForComponent } from "@/composition/container/AppInject"
import {
  ErrorService,
  TOKEN_ERROR_SERVICE,
  ErrorBoundaryReact,
  ErrorMapped,
} from "@/core/Error"
import {
  PropsWithChildren,
  ReactElement,
  cloneElement,
  useEffect,
  useState,
} from "react"
import { tap } from "rxjs"

interface Props extends PropsWithChildren {
  fallback: ReactElement<{ error: ErrorMapped; reset: () => void }>
  errorService: ErrorService
}

export const ErrorBoundaryProvider = injectForComponent({
  errorService: TOKEN_ERROR_SERVICE,
})(ErrorBoundaryProviderPrivate)

export function ErrorBoundaryProviderPrivate({
  children,
  fallback,
  errorService,
}: Props) {
  const [error, setError] = useState<ErrorMapped | null>(null)

  useEffect(() => {
    const subscriber = errorService.error$
      .pipe(
        tap((error) => {
          setError(error as any)
        }),
      )
      .subscribe()

    return () => subscriber.unsubscribe()
  }, [errorService])

  function reset() {
    setError(null)
  }

  return error && error.code === "app/error_mapped/schema/schema_not_valid" ? (
    cloneElement(fallback, { error, reset })
  ) : (
    <ErrorBoundaryReact onError={(error) => errorService.handle(error)}>
      {children}
    </ErrorBoundaryReact>
  )
}
```

### Error Logging Service

To send errors to the console or a monitoring system, you can use the `useErrorReporter` hook.
It subscribes to the error stream from the service and processes errors similarly to the previous examples.

```ts title="src/domains/error/useErrorReporter.ts"
import { injectForFn } from "@/composition/container/AppInject"
import {
  type ErrorService,
  ErrorService,
  TOKEN_ERROR_SERVICE,
} from "@/core/Error"
import { useEffect } from "react"
import { tap } from "rxjs"

export const useErrorReporter = injectForFn({
  errorService: TOKEN_ERROR_SERVICE,
})(useErrorReporterPrivate)

function useErrorReporterPrivate({ errorService }: ErrorService) {
  useEffect(() => {
    const subscriber = errorService.error$
      .pipe(
        tap((error) => {
          console.group("ErrorReporter")

          console.log("Error:", error)

          console.groupEnd()
        }),
      )
      .subscribe()

    return () => subscriber.unsubscribe()
  }, [errorService])
}
```

### Summary

You can extend the system by introducing error factories and typing possible `ErrorMapped` codes.
Similar to `ErrorBoundary` and `useErrorReporter`, it is easy to add additional modules, for example, for filtering and
displaying toast notifications depending on the error type.
The main advantage of our extensible system is the ability to build new modules
following a unified principle, which simplifies maintenance and project development.

## Other Domain Modules

### Throwing HTTP Response Schema Validation Errors

Earlier, we defined the error type `ErrorSchema`.
Using it as an example, we will demonstrate how to throw errors from other layers of the application according to our rules.

```ts title="src/domains/auth/AuthSchema.ts"
import { injectable, inject } from "inversify"
import {
  type ErrorService,
  type ErrorFactory,
  ErrorSchemaBaseFactory,
  TOKEN_ERROR_SERVICE,
} from "@/core/Error"
import * as v from "valibot"

@injectable()
export class AuthSchema {
  private errorService: ErrorService
  private errorFactory: ErrorFactory

  constructor(
    @inject(TOKEN_ERROR_SERVICE) private errorService: ErrorService,
    @inject(ErrorSchemaBaseFactory) private errorFactory: ErrorFactory,
  ) {}

  private readonly meResponse = v.object({
    id: v.string(),
    username: v.string(),
    email: v.string(),
  })

  private readonly meTransform = v.pipe(
    this.meResponse,
    v.transform((value) => {
      return {
        id: value.id,
        username: value.username,
        email: value.email,
      }
    }),
  )

  me(response: unknown) {
    const result = v.safeParse(this.meTransform, response)

    if (result.issues) {
      throw this.errorService.handle(
        this.errorFactory.create({
          status: 0,
          code: "app/auth/schema/me/response_not_valid",
          message: "Response schema not valid",
          issues: result.issues,
        }),
      )
    }

    return result.output
  }
}
```

### Summary

It is important to clearly delineate which layers of the application have access
to `ErrorService` and `ErrorMapper`. At the `HTTP` layer, you can integrate a schema validator with configured error handling rules.
Additionally, the `HTTP` layer itself can handle network errors according to its own rules, using a similar approach
and a unified error handling mechanism.
This approach ensures consistency and extensibility of the error handling system across all levels of the application.

## Conclusion

In this article, we explored a comprehensive approach to error handling in modern applications,
building an architecture with clear contracts and flexible mechanisms for extension, and identified integration
specifics with different environments.
Here is a brief overview of the main tools and modules:

- [RxJS](https://rxjs.dev/) — enables writing subprograms without depending on the reactivity of a specific framework.
- [Inversify](https://inversify.io/) — configures dependencies, linking interfaces and implementations, ensuring flexibility and scalability.
- `ErrorCustom`, `ErrorMapped`, `ErrorSchema` — define the structure and types of errors, providing a unified contract for error handling in the application.
- `ErrorBase`, `ErrorHeavy`, `ErrorSchemaBase`, `ErrorMappedBase` — base error classes with different functionalities, simple error, with stack trace, with validation, adapted error.
- `ErrorBaseFactory`, `ErrorHeavyFactory` — responsible for creating error instances based on given parameters, ensuring uniformity and extensibility.
- `ErrorMapper` — adapts and normalizes any errors into a unified format, simplifying their handling and logging.
- `ErrorService` — the central service for error processing, transformation, and notifying interested modules via an Observable stream.
- `useErrorHandler` — a function that integrates global handling of unhandled environment errors, such as window.onerror, with the error service.
- `ErrorBoundaryReact` — a React component for catching UI errors and forwarding them to the error service.
- `ErrorMapperCustom` — an example implementation of a mapper that handles errors from various sources, such as `Axios` or validation.
- `ErrorBoundaryProvider` — a React component that displays global error pages based on the state of the error service.
- `useErrorReporter` — a hook for logging or sending errors to monitoring systems.
- `AuthSchema` — various layers in the application throw errors according to defined rules, using factories and the error service, ensuring consistency at the business logic level.

This system is not a strict set of rules but a foundation.
Adapt it to your needs while preserving the core principles, and you will
have a reliable error handling mechanism regardless of the framework or environment specifics.
