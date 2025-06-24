---
slug: simple-http-caching-in-angular
title: Simple HTTP Caching in Angular
authors: [GurovDmitriy]
tags: [HttpCaching, Angular, Ramda]
---

![mib-interview](/img/blog/memento-photo.jpg)

HTTP request caching is an important tool for improving performance and reducing server load.
However, implementing caching often requires writing a large amount of repetitive code, as well as carefully designed
logic to control cache lifetime and data updates.
In this article, we will explore a simple way to organize request caching in Angular. This can be considered a 
starting point — the initial steps toward optimizing requests made through HttpClient. <!-- truncate -->

We will implement data caching with limits on cache size and control over the lifetime of cached entries.
In real-world projects, such a module can evolve and expand to provide much more extensive functionality, including complex
strategies for updating, invalidation, and data synchronization.
To ensure immutability of data structures and predictability of operations, we will use the [Immutable.js](https://immutable-js.com/) library. 
This will make it easier to track state changes and prevent accidental data mutations. Additionally, for functional 
operations, we will apply the [Ramda](https://ramdajs.com/) library, which helps write clean and declarative code in a functional style.

## Interface Definitions

### Interface for Cache Item

To implement HTTP request caching in `Angular`, we need a structure that stores the response data along with additional information.
Let's create the `HttpCacheValue` interface, which describes a single cache entry.

```ts title="src/core/http/http-cache.ts"
interface HttpCacheValue {
  data: HttpResponse<unknown>
  date: number
  key: string
}
```

The `data` field represents the full response of type `HttpResponse`.
The `date` field stores the timestamp when the cache entry was created — later we will use it to control the lifetime of each cache item.
The `key` is a unique identifier that allows us to reliably identify and retrieve the cached request.

### Interface for Module Configuration

Let's define the `HttpCacheConfig` interface, which allows configuring the main caching parameters.


```ts title="src/core/http/types.ts"
export interface HttpCacheConfig {
  size: number
  time: number
}
```

The `size` property sets the maximum number of entries that will be stored in the cache. For example, you can limit the cache to the last 10 requests.
The `time` property defines how long a cached entry is considered valid — after this period, it is regarded as expired and subject to refresh.

### Configuration Token

To enable injecting custom caching settings into the `HttpCache` service,
we define a special `Angular` token `TOKEN_HTTP_CACHE_CONFIG`.
This token will be used to inject the configuration via Dependency Injection


```ts title="src/core/http/types.ts"
export const TOKEN_HTTP_CACHE_CONFIG = new InjectionToken<HttpCacheConfig>(
  "app.config HttpCacheConfig",
)
```

## HttpCache Module

### Class Definition

Let's create the `HttpCache` class, which will be responsible for storing and managing cached HTTP requests.
Inside the class, we will define default configuration values and also provide the ability to pass custom settings through the constructor.
To achieve this, we will use `Angular’s` dependency injection with an optional token `TOKEN_HTTP_CACHE_CONFIG`.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  private readonly config: HttpCacheConfig = {
    size: 5,
    time: 30 * 1000,
  }

  constructor(
    @Optional()
    @Inject(TOKEN_HTTP_CACHE_CONFIG)
    private configUser?: Partial<HttpCacheConfig>,
  ) {
    if (configUser) {
      this.config = {
        ...this.config,
        ...this.configUser,
      }
    }
  }
  
  //...
}
```

### Class Fields Definition

Let's add several important fields to the `HttpCache` class:
- `cache` — an immutable `OrderedMap` object from the `Immutable.js` library, which will store cached data in an ordered manner.
- `envService` — an environment service that we inject using the inject function. It will be used to filter requests and correctly handle only those related to our API.
- `cacheKey` and `resetKey` — these are context tokens `HttpContextToken` that allow us to pass and modify unique cache keys within the context of a specific HTTP request via `HttpClient`.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private cache = OrderedMap<string, HttpCacheValue>()
  private envService = inject(TOKEN_ENV)

  cacheKey = new HttpContextToken<string | null>(() => null)
  resetKey = new HttpContextToken<string | null>(() => null)
  
  //...
}
```

### Defining the Method for Integration with HttpInterceptor

Let's create the connect method, which will be used in the `HTTP interceptor` to handle requests and manage caching.
Inside the method, we define several variables:
`key` — a unique key used for reading from and writing to the cache for this request.
`isTypeSkip` — a boolean variable that stores the result of checking whether the request type is suitable for caching 
(for example, GET requests can be cached, while POST requests cannot).
`cacheValue` — the current cached entry value, if it exists.


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  connect(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    let key = ""
    let isTypeSkip = true
    let cacheValue: HttpCacheValue | undefined = undefined

    //...
  }
}
```

The `connect` method accepts the original HTTP request req and a next function to pass control to the next handler.
Later, the logic will be implemented here to determine if the cache can be used for this request, and to either 
return cached data or perform the real HTTP request.
This approach allows easy integration of caching into the HTTP request handling chain via `Angular's` Http Interceptor.

### Cache Reset via Context Key

In some cases, after mutating data (for example, POST, PUT, DELETE requests), it is necessary to reset the cache for related GET requests 
to ensure data freshness. 
To achieve this, we implement a cache reset mechanism by a key passed through the HTTP request context.
In the connect method, we add a call to the `_resetCacheByKey` function, which checks for the presence of a 
special key in the request context and, if found, removes the corresponding cache entry.


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  connect(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    let key = ""
    let isTypeSkip = true
    let cacheValue: HttpCacheValue | undefined = undefined

    this._resetCacheByKey(req)

    //...
  }

  private _resetCacheByKey(req: HttpRequest<unknown>): void {
    const key = req.context.get(this.resetKey)
    if (key) this._cacheRemove(key)
  }

  private _cacheRemove(key: string) {
    this.cache = this.cache.remove(key)
  }
}
```

The `_resetCacheByKey` method looks into the request context `req.context` for the `resetKey`.
If the key is present, `_cacheRemove` is called to delete the corresponding entry from the `OrderedMap` cache.
This mechanism allows, for example, after a successful data update, to clear stale cache so that subsequent GET requests will fetch fresh data.
Later in the article, we can demonstrate an example of using this case by passing the key through `HttpContext` in Angular's `HttpClient`.

### Determining the Request Type

Before applying caching, it is necessary to determine whether the HTTP request type is suitable for caching. 
In our case, we will cache only GET requests directed to our application’s API.
In the connect method, we add a call to a private method `_getIsTypeReqSkip`, which checks:
Whether the request method is GET.
Whether the request URL starts with the base API address (to avoid caching third-party requests).
If the request is not suitable for caching, we immediately pass it along without processing.


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  connect(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    let key = ""
    let isTypeSkip = true
    let cacheValue: HttpCacheValue | undefined = undefined

    this._resetCacheByKey(req)

    isTypeSkip = this._getIsTypeReqSkip(req)
    if (isTypeSkip) return next(req)

    //...
  }

  private _getIsTypeReqSkip(req: HttpRequest<unknown>): boolean {
    if (req.method !== "GET") return true
    if (!req.url.startsWith(this.envService.apiUrl)) return true

    return false
  }
}
```

The `_getIsTypeReqSkip` method returns true if the request is not suitable for caching, and false if processing can continue.
This filter helps avoid unnecessary caching of POST, PUT, DELETE, and other request types, as well as requests to external services.


### Cache Invalidation

To read or store an entry in the cache, we need to compute a unique key. This key 
can be passed through `HttpClient` context tokens, or if absent, we use the request URL with its parameters.
After obtaining the key, the `_invalidateCache` method is called. It checks whether there is a cache 
entry with this key and whether its lifetime has expired. If the entry is outdated, it is removed from the cache.


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  connect(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    let key = ""
    let isTypeSkip = true
    let cacheValue: HttpCacheValue | undefined = undefined

    this._resetCacheByKey(req)

    isTypeSkip = this._getIsTypeReqSkip(req)
    if (isTypeSkip) return next(req)

    key = this._getCacheKey(req)
    cacheValue = this._invalidateCache(key)

    //...
  }

  private _getCacheKey(req: HttpRequest<unknown>): string {
    return req.context.get(this.cacheKey) ?? req.urlWithParams
  }

  private _invalidateCache(key: string): HttpCacheValue | undefined {
    const cacheValue = this.cache.get(key)
    const limit = this.config.time > 0 ? this.config.time : 0

    if (R.isNil(cacheValue)) return undefined
    if (limit === 0) return cacheValue

    if (R.gte(Date.now() - cacheValue.date, limit)) {
      this._cacheRemove(key)
      return undefined
    }

    return cacheValue
  }
}
```

The `_getCacheKey` method tries to obtain the key from the request context; if it is not set, it uses the full URL with parameters.
In `_invalidateCache`, `Ramda` functions are used to check the presence of a cache entry and its validity based on time.
If the cache lifetime is not set or equals zero, the cache is considered permanent.
When the lifetime expires, the entry is removed from the cache to avoid returning stale data.
This approach allows effective management of cache entry lifetimes and prevents the use of outdated information.


### Cache Handling

Now let's implement the logic that checks for the presence of a valid cached entry and returns it if available. 
If the cache is missing or expired, the actual HTTP request is executed, and the received response is saved into the cache.
When adding a new entry, we also control the cache size: if it exceeds the specified limit, the oldest entry is removed


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  connect(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    let key = ""
    let isTypeSkip = true
    let cacheValue: HttpCacheValue | undefined = undefined

    this._resetCacheByKey(req)

    isTypeSkip = this._getIsTypeReqSkip(req)
    if (isTypeSkip) return next(req)

    key = this._getCacheKey(req)
    cacheValue = this._invalidateCache(key)

    if (cacheValue) {
      return of(cacheValue.data.clone()).pipe(
        tap(() => {
          console.log("HttpCache: from cache")
        }),
      )
    } else {
      return next(req).pipe(
        tap((event) => {
          if (event.type === HttpEventType.Response) {
            this._removeOverSizeCache()
            this._installNewCache(key, event.clone())
          }
        }),
      )
    }
  }

  private _removeOverSizeCache(): void {
    const getIsSizeOver = R.ifElse(
      () => R.gt(this.config.size, 0),
      () => R.gte(this.cache.size, this.config.size),
      () => false,
    )

    const getNewCache = R.ifElse(
      (oldKey: string | undefined) =>
        R.and(R.isNotNil(oldKey), getIsSizeOver()),
      (oldKey: string | undefined) => this.cache.remove(oldKey as string),
      () => this.cache,
    )

    this.cache = getNewCache(this.cache.keySeq().last())
  }

  private _installNewCache(key: string, data: HttpResponse<unknown>): void {
    this.cache = this.cache.set(key, {
      data,
      date: Date.now(),
      key,
    })
  }
}
```

If a valid cache entry `cacheValue` is found, we return its cloned copy using of() from `RxJS` to comply with the `Observable` contract. The of operator 
creates an `Observable` that emits the given value and then completes, 
making it ideal for returning static cached data as an `Observable` stream.
If the cache is missing, the next handler `next(req)` is called to perform the actual HTTP request.
After receiving a response of type `HttpEventType.Response`, we call `_removeOverSizeCache()` to control the cache 
size and `_installNewCache()` to save the new response.
The `_removeOverSizeCache` method uses `Ramda` to check if the cache size limit is exceeded, and if so, removes the oldest (last inserted) entry.
The `_installNewCache` method adds a new entry to the `OrderedMap` with the current timestamp.

### Defining Helper Functions for Working with Context

To simplify working with `HttpContext` in Angular's `HttpClient`, let's define two helper functions that 
make it easy to create contexts with the necessary keys for caching and cache resetting.


```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  setCtxCacheKey(key: string): HttpContext {
    return new HttpContext().set(this.cacheKey, key)
  }

  setCtxResetKey(key: string): HttpContext {
    return new HttpContext().set(this.resetKey, key)
  }
}
```

The `setCtxCacheKey` function creates a new instance of `HttpContext` and sets the cacheKey in it. Such a context 
can be passed along with an HTTP request to control caching behavior.
Similarly, `setCtxResetKey` creates a context with the `resetKey`, which is used to trigger cache invalidation.
Using these helper functions simplifies working with the context and allows centralized management of caching keys within the application.

## Integration

### Connecting to the Interceptor

To integrate our caching module into Angular’s HTTP request processing chain, 
we create an HTTP interceptor that calls the connect method of the `HttpCache` class.


```ts title="src/core/http/http-cache.interceptor.ts"
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(HttpCache)

  return cache.connect(req, next)
}
```

### Defining Custom Configuration

To configure caching parameters, you can define your own configuration object that overrides the default values.


```ts title="src/domains/http/http-cache.config.ts"
export const httpCacheConfig: HttpCacheConfig = {
  size: 10,
  time: 120 * 1000,
}
```

### Setting Up Providers

To apply your custom caching configuration and register the HTTP interceptor that uses the `HttpCache` service, 
you need to configure providers in your `Angular` app.

```ts title="src/composition/provider/app-http-client.provider.ts"
export function appHttpClientProvider(): Provider | EnvironmentProviders {
  return [
    {
      provide: TOKEN_HTTP_CACHE_CONFIG,
      useValue: httpCacheConfig,
    },
    provideHttpClient(
      withInterceptors([
        httpCacheInterceptor,
        //...
      ]),
    ),
  ]
}
```

### Using Keys

Now, in API services, we can explicitly specify keys for caching requests if the default key based on 
the URL does not suit us. This allows more flexible cache management: overriding keys for storing data and defining 
dependencies between requests.
For example, when updating user data `meUpdate`, we can reset the cache for the related GET request `me` by using a pre-defined key.


```ts title="src/domanins/auth/auth-api.service.ts"
@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  //...
  private httpCache = inject(HttpCache)

  me(): Observable<AuthUser> {
    return this.httpClient
      .get<AuthUser>(`${this.envService.apiUrl}/auth/me`, {
        context: this.httpCache.setCtxCacheKey("auth/me"),
      })
      .pipe(map((value) => this.schema.me(value)))
  }

  meUpdate(payload: AuthMeUpdatePayload): Observable<AuthUser> {
    return this.httpClient.post<AuthUser>(
      `${this.envService.apiUrl}/auth/me-update`,
      payload,
      {
        context: this.httpCache.setCtxResetKey("auth/me"),
      },
    )
  }

  //...
}
```

In the `me()` method, we explicitly set the cache key `auth/me` via the request context to store the response under this key.
In the `meUpdate()` method, when sending a POST request, we specify the key for cache reset — `auth/me`. This ensures that after a 
successful update, the user data will be re-fetched and the cache will be refreshed.
This approach allows creating dependencies between requests and controlling the freshness of cached data.
Using Angular `HttpClient` context with keys provides flexibility and precision in cache management, especially in complex applications 
with many interrelated data.

## Conclusion

In this article, we examined a basic implementation of HTTP request caching in `Angular` using [Immutable.js](https://immutable-js.com/) and 
[Ramda](https://ramdajs.com/) for convenient and reliable data handling. We created a simple yet flexible module that allows controlling cache size, 
entry lifetime, and provides the ability to reset the cache by keys. This approach serves as an excellent starting point for building 
more complex and scalable caching solutions in your applications.

You can see the cache in action and access the full code:
- [FWC-Angular GitHub](https://github.com/GurovDmitriy/fwc-angular)
- [FWC-Angular Website](https://gurovdmitriy.github.io/fwc-angular/)
