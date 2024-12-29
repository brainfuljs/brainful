---
slug: Inversion of Control
title: Inversion of Control
authors: [GurovDmitriy]
tags:
  [
    Inversion of Control,
    IoC Container,
    Dependency Inversion,
    Dependency Injection,
    Inversify,
    Books,
    Mark Seemann,
    Remo H. Jansen,
  ]
---

Inversion of Control (IoC) is a fundamental design principle in software engineering that shifts the
control of object creation and flow of execution from the application code to an external framework or container.<!-- truncate -->
This approach enhances modularity, testability, and maintainability by decoupling the components of a system.
By inverting control, developers can focus on implementing business logic while the IoC container manages dependencies and object lifecycles.

## Defining the Dependency Injection Mechanism

Dependency Injection (DI) is a specific form of Inversion of Control that involves providing external dependencies to software components.
Instead of a class instantiating its own dependencies, these are provided externally, typically via constructors,
properties, or method parameters. This allows classes to rely on abstractions rather than concrete implementations, promoting
loose coupling and easier testing. By leveraging DI, interacting classes depend on an infrastructure that manages the creation and
lifecycle of their dependencies.

## Misconceptions about DI

Several common misconceptions exist regarding Dependency Injection:

- DI is only about late binding: While DI often involves late binding, its primary purpose is to reduce tight coupling between components.
  This flexibility allows for easier maintenance and adaptation of code.
- DI is only relevant for unit testing: Although DI significantly aids in creating testable code,
  its benefits extend beyond testing scenarios. It enhances overall code maintainability and adaptability.
- DI is a form of abstract factory: While both DI and abstract factories deal with object creation, they serve different purposes.
  DI focuses on managing dependencies, while abstract factories provide interfaces for creating objects without specifying their concrete classes.
- A DI container is necessary for DI: While containers simplify the implementation of dependency injection, it can also be achieved without
  them by using basic design patterns.

## Using the Principle of DI Without a Container

Example of Class Composition: You can create classes and pass their instances into the constructors of other classes.

```js
class ServiceA {}

class ServiceB {
  constructor(serviceA) {
    this.serviceA = serviceA
  }
}
```

Example with Function Argument Passing: Instead of creating dependencies within a class, they can be passed as parameters to methods.

```js
function execute(serviceA) {
  // Logic using serviceA
}
```

## Advantages of Dependency Injection

- Late Binding: Allows for replacing services with different implementations without modifying existing code.
- Extensibility: Simplifies the reuse and modification of components.
- Parallel Development: Different teams can work on various parts of the system independently.
- Maintainability: Code becomes clearer and easier to support.
- Testability: Facilitates unit testing by allowing dependencies to be easily mocked or substituted.

## Types of Injection

- Constructor Injection: Dependencies are provided through constructor parameters.
- Property Injection: Dependencies are set through public properties.
- Method Injection: Dependencies are passed as arguments to methods.

## What Can Be Injected and What Cannot

It's crucial to distinguish between stable and unstable dependencies:

- Stable Dependencies: Classes with predictable behavior (e.g., utility classes).
- Unstable Dependencies: Classes whose behavior depends on context or time (e.g., services interacting with external APIs).

## Managing Object Lifecycle

The lifecycle management of objects in the context of DI involves controlling their creation, usage, and destruction.
Various lifecycle management strategies include:

- Singleton: A single instance is shared across the application.
- Transient: A new instance is created each time it is requested.
- Per Graph: Instances are created for each graph of objects.
- Web Request Context: Instances are created for each web request.
- Pooled: Instances are reused from a pool.

## Inversion of Control (IoC) and Dependency Injection (DI)

Inversion of Control is a general design principle that separates implementation from interface.
Dependency Injection is a specific implementation of this principle. The core idea is to use interfaces instead of concrete classes,
enabling easy replacement of implementations without modifying dependent code.

## Patterns of Dependency Injection

- Constructor Injection
- Property Injection
- Method Injection
- Ambient Context
- Each pattern has its own use cases depending on project requirements.

## Anti-patterns in DI

Some common anti-patterns include:

- Service Locator: Using a global object to obtain dependencies instead of explicitly defining them.
- Control Freak: A class that excessively controls its dependencies.
- Bastard Injection: Misusing DI where dependencies are passed implicitly or chaotically.
- Constrained Construction: Overloading constructors with too many parameters.

## Inversify

InversifyJS is a powerful and lightweight inversion of control (IoC) container for JavaScript and TypeScript applications.
It allows developers to implement Dependency Injection (DI) easily, promoting better organization and maintainability of code.
With InversifyJS, you can define dependencies using decorators and manage them through a central container,
which resolves dependencies automatically.

InversifyJS was created by Remo H. Jansen, a software engineer who specializes in JavaScript and TypeScript.
His work on InversifyJS has significantly contributed to the JavaScript community by providing a robust tool for managing dependencies
in applications. Remo's dedication to open-source development has made InversifyJS a popular choice among developers looking to implement
Dependency Injection in their projects.
By incorporating InversifyJS into your applications, you can leverage the benefits of Dependency Injection,
leading to cleaner architecture and improved code quality.

```js
var inversify = require("inversify")

var TYPES = {
  Ninja: "Ninja",
  Katana: "Katana",
  Shuriken: "Shuriken",
}

class Katana {
  hit() {
    return "cut!"
  }
}

class Shuriken {
  throw() {
    return "hit!"
  }
}

class Ninja {
  constructor(katana, shuriken) {
    this._katana = katana
    this._shuriken = shuriken
  }
  fight() {
    return this._katana.hit()
  }
  sneak() {
    return this._shuriken.throw()
  }
}

// Declare as injectable and its dependencies
inversify.decorate(inversify.injectable(), Katana)
inversify.decorate(inversify.injectable(), Shuriken)
inversify.decorate(inversify.injectable(), Ninja)
inversify.decorate(inversify.inject(TYPES.Katana), Ninja, 0)
inversify.decorate(inversify.inject(TYPES.Shuriken), Ninja, 1)

// Declare bindings
var container = new inversify.Container()
container.bind(TYPES.Ninja).to(Ninja)
container.bind(TYPES.Katana).to(Katana)
container.bind(TYPES.Shuriken).to(Shuriken)

// Resolve dependencies
var ninja = container.get(TYPES.Ninja)
return ninja
```

## Conclusion

This article provides a brief overview of the work from Mark Seemann's book, Dependency Injection in .NET. His work serves as a
comprehensive guide on how to effectively implement Dependency Injection to minimize hard-coded dependencies among application components.
Studying Dependency Injection and Inversion of Control requires an understanding of various concepts and design patterns.
This knowledge empowers developers to create more flexible and maintainable systems.
