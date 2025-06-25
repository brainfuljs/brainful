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

### HttpCacheValue Interface

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

### HttpCacheConfig Interface

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
This token will be used to inject the configuration via Dependency Injection.

```ts title="src/core/http/token.ts"
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
  private envService = inject(TOKEN_ENV)
  
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

The `envService` — an environment service that we inject using the inject function. It will be used to filter 
requests and correctly handle only those related to our API.

### Class Fields Definition

Let's add several important fields to the `HttpCache` class:
- `cache` — an immutable `OrderedMap` object from the `Immutable.js` library, which will store cached data in an ordered manner.
- `tokenKeyCacheSave` and `tokenKeyCacheReset` — these are context tokens `HttpContextToken` that allow us to pass and modify unique cache keys within the context of a specific HTTP request via `HttpClient`.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private envService = inject(TOKEN_ENV)

  private cache = OrderedMap<string, HttpCacheValue>()

  tokenKeyCacheSave = new HttpContextToken<string | null>(() => null)
  tokenKeyCacheReset = new HttpContextToken<string | null>(() => null)

  //...
}
```

### Defining the Method for Integration with HttpInterceptor

Let's create the connect method, which will be used in the HTTP Interceptor to handle requests and manage caching.

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
    //...
  }
}
```

The `connect` method accepts the original HTTP request req and a next function to pass control to the next handler.
Later, the logic will be implemented here to determine if the cache can be used for this request, and to either
return cached data or perform the real HTTP request.
This approach allows easy integration of caching into the HTTP request handling chain via `Angular's` Http Interceptor.

### Cache Checking Steps

Let's first describe the logic of how we will work with the cache using pseudo-functions, and then proceed to implement these functions.
- The `_removeCache` function checks if there is an HTTP context token to reset the cache, for example, related to some POST request.
- Next, with `_getIsTypeReqSkip`, we check if the request type is suitable for caching — for example, we only cache GET requests.
- The `_getKeyCache` function is needed to correctly obtain the cache key for checking or later saving.
- Then we check if the cache for this request has expired using `_getIsExpireCache`.
- If it has not expired, we return the cached value.
- If the cache is missing or expired, we perform the actual request, save the response, and also check with `_getIsOverSizeCache` whether the cache size exceeds the limit defined in the settings.


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
    this._removeCache(this._getKeyResetFromCtx(req))

    if (this._getIsTypeReqSkip(req)) return next(req)

    const key = this._getKeyCache(req)

    if (R.isEmpty(key)) return next(req)

    const cacheValue = this.cache.get(key)

    if (cacheValue && R.not(this._getIsExpireCache(cacheValue))) {
      return of(cacheValue.data.clone()).pipe(
        tap(() => {
          console.log("HttpCache: from cache")
        }),
      )
    }

    return next(req).pipe(
      tap((event) => {
        if (event.type === HttpEventType.Response) {
          this._saveCache(key, event.clone())
          if (this._getIsOverSizeCache()) this._removeCacheLast()
        }
      }),
    )
  }
}
```

That’s it — a brief overview of our small algorithm for working with cached requests. Below, we will proceed to implement the functions.

### Defining Helper Functions for Working with Context

To simplify working with `HttpContext` in Angular's `HttpClient`, let's define two helper functions that
make it easy to create contexts with the necessary keys for caching and cache resetting.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  setKeyCacheSaveCtx(key: string): HttpContext {
    return new HttpContext().set(this.tokenKeyCacheSave, key)
  }

  setKeyCacheResetCtx(key: string): HttpContext {
    return new HttpContext().set(this.tokenKeyCacheReset, key)
  }
}
```

The `setKeyCacheSaveFromCtx` function creates a new instance of `HttpContext` and sets the cacheKey in it. Such a context
can be passed along with an HTTP request to control caching behavior.
Similarly, `setKeyCacheResetFromCtx` creates a context with the `resetKey`, which is used to trigger cache invalidation.
Using these helper functions simplifies working with the context and allows centralized management of caching keys within the application.

### Saving and Removing Cache

Let's define functions for how we can save and remove cache entries.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private _saveCache(key: string, data: HttpResponse<unknown>): void {
    this.cache = this.cache.set(key, {
      data,
      date: Date.now(),
      key,
    })
  }

  private _removeCache(key: string | null | undefined): void {
    if (key) {
      this.cache = this.cache.remove(key)
    }
  }

  private _removeCacheLast(): void {
    R.when(
      (key: string | undefined): key is string => R.isNotNil(key),
      (key) => this._removeCache(key),
    )(this.cache.keySeq().first())
  }
}
```

- The `_saveCache` method saves a new cache entry with the current timestamp.
- The `_removeCache` method removes a cache entry by its key if the key is defined.
- The `_removeCacheLast` method removes the oldest cache entry, the first key in the sequence, if it exists, using Ramda's when and isNotNil helpers.

### Retrieving Cache Keys

These functions help us extract the key from the provided `HttpContext` or, by default, from the URL,
as well as obtain the key for cache invalidation on demand.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private _getKeyCache(req: HttpRequest<unknown>): string {
    return req.context.get(this.tokenKeyCacheSave) ?? req.urlWithParams
  }

  private _getKeyResetFromCtx(req: HttpRequest<unknown>): string | null {
    return req.context.get(this.tokenKeyCacheReset)
  }
}
```

The `_getKeyCache` method returns the cache key from the request context token `tokenKeyCacheSave`, or falls back to the full 
URL with parameters if the token is not set.
The `_getKeyResetFromCtx` method retrieves the cache reset key from the request context token `tokenKeyCacheReset`, or returns null if not present.

### Skipping Request Types

Let's define a function that filters request types suitable for caching.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private _getIsTypeReqSkip(req: HttpRequest<unknown>): boolean {
    return R.cond([
      [
        (req: HttpRequest<unknown>) =>
          R.complement(R.equals)(req.method, "GET"),
        () => true,
      ],
      [(req) => R.not(req.url.startsWith(this.envService.apiUrl)), () => true],
      [R.T, () => false],
    ])(req)
  }
}
```

The `_getIsTypeReqSkip` method returns true if the request method is not GET or if the request URL 
does not start with the configured API base URL, indicating the request should be skipped for caching.
Otherwise, it returns false, meaning the request is suitable for caching.

### Cache Size Limit

Let's check whether the number of entries in the cache exceeds the configured limit.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private _getIsOverSizeCache(): boolean {
    return R.ifElse(
      () => R.gt(this.config.size, 0),
      () => R.gt(this.cache.size, this.config.size),
      () => true,
    )()
  }
}
```

The `_getIsOverSizeCache` method returns true if the cache size limit `this.config.size` is set and the current cache size exceeds it.
If the configured size is zero or not set, the cache is considered unlimited, and the method returns true by default.

### Expiration of HttpCacheValue

Let's check whether a cache entry has expired.

```ts title="src/core/http/http-cache.ts"
@Injectable({
  providedIn: "root",
})
export class HttpCache {
  //...

  private _getIsExpireCache(value: HttpCacheValue | null | undefined): boolean {
    if (R.isNil(value)) return true

    return R.ifElse(
      () => R.gt(this.config.time, 0),
      () => R.gt(Date.now() - value.date, this.config.time),
      () => true,
    )()
  }
}
```

The `_getIsExpireCache` method returns true if the cache entry is null or undefined, indicating it is expired or missing.
If a cache lifetime `this.config.time` is set and greater than zero, it checks whether the elapsed time since the cache entry was saved 
exceeds this lifetime.
If no lifetime is set, the cache is considered expired by default.

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
        context: this.httpCache.setKeyCacheSaveCtx("auth/me"),
      })
      .pipe(map((value) => this.schema.me(value)))
  }

  meUpdate(payload: AuthMeUpdatePayload): Observable<AuthUser> {
    return this.httpClient.post<AuthUser>(
      `${this.envService.apiUrl}/auth/me-update`,
      payload,
      {
        context: this.httpCache.setKeyCacheResetCtx("auth/me"),
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
