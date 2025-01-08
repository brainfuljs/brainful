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
    Mark Seemann,
    Remo H. Jansen,
  ]
---

This article provides an overview of the key points that need to be covered when studying the topic of Inversion of Control.

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

### Late Binding  

Allows for replacing services with different implementations without modifying existing code.
Late binding refers to the ability to resolve dependencies at runtime rather than at compile time. 
This flexibility allows developers to replace services with different implementations without modifying the existing codebase. 
For example, if you need to switch from one logging service to another, you can do so by changing the configuration in the DI container without 
touching the classes that utilize the logger. This promotes a more adaptable architecture that can easily accommodate changes in requirements 
or technology.

### Extensibility   

Simplifies the reuse and modification of components.
Dependency Injection enhances extensibility by allowing developers to add new features or components without disrupting existing functionality. 
When components are loosely coupled through DI, new implementations can be introduced seamlessly. 
For instance, if a new payment processing service is required, it can be implemented and injected into the application without 
altering the core logic of existing services. This capability encourages a modular design where components can evolve independently.

### Parallel Development

With DI, different teams can work on various parts of a system independently. 
Since components are decoupled and interact through well-defined interfaces, teams can develop, 
test, and deploy their components without waiting for others to finish their tasks. 
This parallel development approach accelerates project timelines and enhances collaboration among teams, as they can focus on 
their specific areas of expertise without being hindered by interdependencies.

### Maintainability

Code becomes clearer and easier to support.
Code maintainability is significantly improved through Dependency Injection. 
By reducing tight coupling between classes, DI makes it easier to understand and modify code. 
When dependencies are clearly defined and managed externally, developers can quickly identify where changes 
need to be made when issues arise or when enhancements are required. This clarity leads to less time spent on debugging and more efficient updates, 
ultimately resulting in a more robust codebase.

### Testability

One of the most significant benefits of Dependency Injection is its impact on testability. 
By allowing dependencies to be easily mocked or substituted, DI simplifies unit testing. 
Developers can create mock implementations of services and inject them into classes under test, enabling them to isolate functionality 
and verify behavior without relying on actual implementations or external systems. This leads to more reliable tests and encourages 
a test-driven development (TDD) approach, which enhances overall software quality. 

## Types of Injection

### Constructor Injection

Constructor Injection is one of the most common and widely used methods for implementing Dependency Injection. 
In this approach, dependencies are provided to a class through its constructor parameters. 
This method ensures that a class receives all its required dependencies at the time of instantiation, promoting immutability and 
making it clear what dependencies a class needs to function properly.

### Property Injection

Property Injection allows dependencies to be set through public properties of a class after the object has been instantiated. 
This method provides flexibility in how dependencies are assigned, as they can be modified at any point in the object's lifecycle.

### Method Injection

Method Injection involves passing dependencies as arguments to specific methods of a class. 
This approach is useful when a dependency is needed only for certain operations rather than throughout the entire lifecycle of the object.

## What Can Be Injected and What Cannot

When implementing Dependency Injection (DI), it is crucial to distinguish between stable and unstable dependencies, 
as this distinction can significantly impact the design and maintainability of your application.

### Stable Dependencies

Stable dependencies refer to classes or components that exhibit predictable behavior and do not change frequently. 
These are typically well-defined utility classes or services that provide consistent functionality over time.

Characteristics of Stable Dependencies:

- Predictability: They behave consistently, making them reliable for other components to depend on.
- Low Risk of Change: Changes in stable dependencies are infrequent, reducing the risk of introducing bugs in dependent components.
- Examples: Utility classes for logging, configuration management, or mathematical calculations are often stable dependencies.

By relying on stable dependencies, developers can create a solid foundation within their applications, minimizing the potential for 
disruptions when changes occur.

### Unstable Dependencies

Unstable dependencies, on the other hand, are classes or components whose behavior can vary based on context or time. 
These dependencies often interact with external systems, such as APIs or databases, making them more susceptible to changes.

Characteristics of Unstable Dependencies:
- Context-Dependent Behavior: Their functionality may change based on external factors, such as user input or network availability.
- Higher Risk of Change: Frequent modifications or updates to unstable dependencies can lead to cascading effects on other components that rely on them.
- Examples: Services that interact with external APIs, third-party libraries, or components that require real-time data are typically considered unstable.

Understanding the nature of your dependencies allows you to design your application architecture more effectively. 
By minimizing reliance on unstable dependencies in critical areas of your application, you can enhance stability and reduce the risk of errors.

## Managing Object Lifecycle

Managing the lifecycle of objects in the context of Dependency Injection (DI) involves controlling how and when instances of 
dependencies are created, used, and disposed of. Proper lifecycle management is crucial for ensuring efficient resource 
utilization and maintaining application performance. Various lifecycle management strategies include.

### Singleton

A Singleton is a design pattern where a single instance of a class is shared across the entire application. 
This means that every time a dependency is requested, the same instance is returned. 
Singleton instances are typically used for services that maintain global state or configuration settings.

Advantages:
- Resource Efficiency: Since only one instance exists, it can help conserve memory and other resources.
- Consistency: Ensures that all components using the service share the same state and behavior.

### Transient

In the Transient lifecycle, a new instance of the dependency is created each time it is requested from the DI container. 
This approach is suitable for lightweight, stateless services that do not need to maintain any shared state.

Advantages:
- Isolation: Each consumer receives its own instance, preventing unintended side effects from shared state.
- Flexibility: Ideal for services that require unique configurations or states.

### Per Graph

The Per Graph lifecycle creates instances for each graph of objects. 
This means that if multiple components depend on the same service within a single graph of dependencies, 
they will receive the same instance. However, different graphs will get different instances.

Advantages:
- Scoped Sharing: Allows sharing instances within a specific context while isolating them from other contexts.
- Efficient Resource Use: Reduces overhead by reusing instances within a defined scope.

### Pooled

The Pooled lifecycle manages instances by reusing them from a pool. 
When a dependency is requested, an existing instance from the pool is provided if available; otherwise, a new instance is 
created and added to the pool. This approach can improve performance by reducing instantiation overhead for frequently used services.

### Web Request Context

In web applications, the Web Request Context lifecycle creates a new instance of a dependency for each web request. 
This ensures that dependencies are scoped to individual requests, which is particularly useful for managing stateful services 
like session management or user authentication.

Advantages:
- Request Isolation: Each web request has its own set of dependencies, preventing data leakage between requests.
- State Management: Facilitates handling user-specific data during a request's lifecycle.


## Inversion of Control (IoC) and Dependency Injection (DI)

Inversion of Control is a general design principle that separates implementation from interface.
Dependency Injection is a specific implementation of this principle. The core idea is to use interfaces instead of concrete classes,
enabling easy replacement of implementations without modifying dependent code.

## Anti-patterns in DI

While Dependency Injection (DI) offers numerous benefits, there are also common anti-patterns that can undermine its effectiveness. 
Understanding these anti-patterns is essential for maintaining clean and maintainable code. Here are some of the most prevalent anti-patterns in DI.

### Service Locator

The Service Locator pattern involves using a global object to obtain dependencies instead of explicitly defining them through injection. 
While it may seem convenient, this approach obscures the dependencies of a class and can lead to runtime errors if dependencies are not 
registered correctly.

Problems with Service Locator:
- Hidden Dependencies: The class does not clearly communicate what its dependencies are, making it difficult to understand how it functions without inspecting the code.
- Runtime Exceptions: If a required service is not registered in the locator, it can lead to runtime exceptions that are harder to debug.
- Testing Challenges: Unit testing becomes more complex since the class relies on a static service locator, making it difficult to mock dependencies.

### Control Freak

A class that excessively controls its dependencies is referred to as a Control Freak. 
This occurs when a class directly instantiates its dependencies rather than accepting them through DI. 
This tight coupling makes it difficult to switch implementations or mock dependencies for testing.

Problems with Control Freak:
- Tight Coupling: The class is tightly coupled to specific implementations, making it challenging to change or replace them.
- Difficult Testing: Unit testing becomes problematic because the class cannot be easily mocked or isolated from its dependencies.

### Bastard Injection

Bastard Injection refers to the misuse of DI where dependencies are passed implicitly or chaotically. 
This can occur when developers attempt to inject too many dependencies or when they rely on context or global state instead of clear interfaces.

Problems with Bastard Injection:
- Confusion: It becomes unclear which dependencies are required for a class, leading to confusion and maintenance challenges.
- Violation of Principles: This approach often violates principles such as Single Responsibility Principle (SRP) and can lead to bloated classes.

### Constrained Construction
Constrained Construction occurs when constructors are overloaded with too many parameters. 
This often indicates that a class has too many responsibilities and violates the Single Responsibility Principle (SRP).

Problems with Constrained Construction:
- Complexity: Classes with numerous constructor parameters become complex and difficult to manage.
- Maintenance Issues: Changes in one dependency may require modifications in multiple places throughout the codebase.

By being aware of these anti-patterns, developers can avoid common pitfalls associated with Dependency Injection. 
By adhering to best practices and ensuring clear communication of dependencies, applications can maintain flexibility, testability, 
and overall code quality.

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
