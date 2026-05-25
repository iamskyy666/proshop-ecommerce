```js
// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

export default store;

// src/slices/apiSlice.js
// parent slice for other API slices

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";

const baseQuery = fetchBaseQuery({ baseUrl: BASE_URL });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["Product", "Order", "User"],
  endpoints: (builder) => ({}),
});

// src/slices/productsApiSlice.js
import { PRODUCTS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => ({
        url: PRODUCTS_URL, // No fetch/axios requests needed.
      }),
      keepUnusedDataFor: 5,
    }),
    getProductDetails: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`, // No fetch/axios requests needed.
      }),
      keepUnusedDataFor: 5,
    }),
  }),
});

// convention - automatic naming
export const { useGetProductsQuery, useGetProductDetailsQuery } =
  productsApiSlice;

```

Understanding these three files deeply will make RTK Query feel much less like "magic" and much more like a system we can reason about.

---

# Big Picture First

Before RTK Query, a typical React component looked like:

```jsx
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchProducts() {
    try {
      const { data } = await axios.get("/api/products");
      setProducts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  fetchProducts();
}, []);
```

Every page repeats:

* state
* loading state
* error state
* API call
* cache management
* refetch logic

RTK Query centralizes all of that.

Think of RTK Query as:

```txt
React Component
       │
       ▼
Generated Hook
       │
       ▼
RTK Query Engine
       │
       ▼
Redux Store Cache
       │
       ▼
Backend API
```

---

# Architecture Overview

Our setup creates three layers:

```txt
store.js
│
├── apiSlice.js
│     │
│     ├── productsApiSlice.js
│     ├── usersApiSlice.js
│     ├── ordersApiSlice.js
│     └── cartApiSlice.js
│
└── React Components
```

Responsibilities:

### store.js

Creates Redux store and activates RTK Query.

### apiSlice.js

Creates the base API service.

### productsApiSlice.js

Adds product-specific endpoints.

---

# Part 1 — store.js

---

## What is a Redux Store?

A Redux store is a giant JavaScript object.

Example:

```js
{
  products: [],
  cart: [],
  userInfo: {},
}
```

Redux stores application state centrally.

Instead of:

```txt
Component A state
Component B state
Component C state
```

we have:

```txt
Single Source of Truth
```

inside the Redux store.

---

## configureStore()

```js
const store = configureStore(...)
```

Redux Toolkit replaced:

```js
createStore()
```

with:

```js
configureStore()
```

because it automatically configures:

* Redux DevTools
* thunk middleware
* development checks
* middleware setup

Less boilerplate.

---

# reducer section

```js
reducer: {
  [apiSlice.reducerPath]: apiSlice.reducer,
},
```

This line deserves special attention.

---

## What is reducerPath?

In apiSlice:

```js
createApi(...)
```

automatically creates:

```js
apiSlice.reducerPath
```

Default value:

```js
"api"
```

So Redux sees:

```js
reducer: {
  api: apiSlice.reducer,
}
```

---

Meaning:

```txt
Redux State
│
└── api
     ├── queries
     ├── mutations
     ├── subscriptions
     └── cache
```

RTK Query stores all API information there.

---

# Why does RTK Query need a reducer?

Because it manages state.

For example:

```txt
Loading?
Error?
Data?
Cached?
Request status?
```

must live somewhere.

That somewhere is:

```js
state.api
```

---

Example after fetching products:

```js
{
  api: {
    queries: {
      getProducts: {
        status: "fulfilled",
        data: [...]
      }
    }
  }
}
```

---

# Middleware

This is where the real magic happens.

```js
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat(apiSlice.middleware)
```

---

Without middleware:

```txt
Redux only stores data.
```

It doesn't know how to:

* call APIs
* handle async work
* cache responses

Middleware adds those capabilities.

---

Imagine:

```txt
Action dispatched
        │
        ▼
Middleware
        │
        ▼
Reducer
```

Middleware intercepts actions before reducers see them.

---

Example:

Component:

```js
useGetProductsQuery()
```

dispatches:

```js
{
  type: "api/executeQuery"
}
```

Middleware catches it:

```txt
Need network request.
```

Performs:

```http
GET /api/products
```

Receives response.

Stores cache.

Updates loading state.

Notifies components.

---

Without middleware:

```txt
No API request
No cache
No RTK Query
```

would work.

---

# Part 2 — apiSlice.js

This is the foundation of the entire API system.

---

Import

```js
import { createApi, fetchBaseQuery }
```

These are RTK Query tools.

---

# fetchBaseQuery()

```js
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
});
```

Let's think of this as:

```txt
Mini Axios
```

built into RTK Query.

---

Suppose:

```js
BASE_URL = "http://localhost:5000"
```

Then:

```js
url: "/api/products"
```

becomes:

```txt
http://localhost:5000/api/products
```

automatically.

---

Equivalent axios:

```js
axios.create({
  baseURL: BASE_URL,
});
```

Very similar concept.

---

# createApi()

```js
export const apiSlice = createApi(...)
```

This creates a centralized API service.

Let's think:

```txt
API Manager
```

---

Configuration:

```js
createApi({
  baseQuery,
  tagTypes,
  endpoints
})
```

---

# baseQuery

```js
baseQuery
```

tells RTK Query:

```txt
How should requests be sent?
```

Answer:

```txt
Use fetch()
through fetchBaseQuery
```

---

# tagTypes

```js
tagTypes: ["Product", "Order", "User"]
```

These are cache labels.

Used later for automatic cache invalidation.

---

Example:

Fetch products.

Cache tagged:

```txt
Product
```

Create product.

RTK Query sees:

```txt
Product cache invalidated
```

and automatically refetches products.

Without tags:

You manually refetch.

With tags:

Automatic.

---

# Empty endpoints

```js
endpoints: (builder) => ({})
```

Why empty?

Because this is only the parent API.

It acts like a container.

Child slices inject endpoints later.

---

Let's think:

```txt
apiSlice
│
├── productsApiSlice
├── usersApiSlice
├── ordersApiSlice
└── cartApiSlice
```

All share:

* base URL
* middleware
* cache system

---

# Part 3 — productsApiSlice.js

Now we extend the parent API.

---

injectEndpoints()

```js
apiSlice.injectEndpoints(...)
```

Instead of creating another API service:

```js
createApi(...)
```

we reuse the existing one.

---

Let's think:

```txt
Base API
```

becomes:

```txt
Base API
 └── Products API
```

Not:

```txt
Separate API
```

---

# builder.query()

```js
builder.query(...)
```

Creates a GET endpoint.

---

Equivalent REST mapping:

```txt
query     -> GET
mutation  -> POST
mutation  -> PUT
mutation  -> DELETE
```

---

# getProducts

```js
getProducts: builder.query(...)
```

Defines:

```txt
GET /api/products
```

---

query()

```js
query: () => ({
  url: PRODUCTS_URL,
})
```

returns:

```js
{
  url: "/api/products"
}
```

RTK Query combines:

```txt
baseUrl
+
url
```

Result:

```txt
http://localhost:5000/api/products
```

---

Then internally:

```txt
fetch()
```

is executed.

---

# keepUnusedDataFor

```js
keepUnusedDataFor: 5
```

One of the coolest RTK Query features.

---

Suppose:

User opens Home page.

RTK Query fetches:

```txt
products
```

and caches them.

---

User navigates away.

No component uses products anymore.

Cache timer starts:

```txt
5 seconds
```

---

Returns after:

```txt
3 seconds
```

Uses cache.

No request.

Instant render.

---

Returns after:

```txt
7 seconds
```

Cache removed.

Fresh request sent.

---

# Product Details

```js
getProductDetails
```

Similar concept.

---

Receives parameter:

```js
productId
```

Example:

```js
"123"
```

---

Builds URL:

```js
url: `/api/products/123`
```

Result:

```http
GET /api/products/123
```

---

Different product IDs create different cache entries:

```txt
product-1 cache
product-2 cache
product-3 cache
```

independently.

---

# Auto-generated Hooks

This is where many people think magic happens.

---

RTK Query reads:

```js
getProducts
```

and generates:

```js
useGetProductsQuery()
```

Automatically.

---

Reads:

```js
getProductDetails
```

and generates:

```js
useGetProductDetailsQuery()
```

Automatically.

---

Naming rule:

```txt
endpoint name
     ↓
use + Name + Query
```

Examples:

```txt
getProducts
↓
useGetProductsQuery
```

```txt
getUserProfile
↓
useGetUserProfileQuery
```

---

# What happens when HomeScreen mounts?

Component:

```js
const {
  data,
  isLoading,
  isError,
  error
} = useGetProductsQuery();
```

Sequence:

```txt
Component mounts
```

↓

```txt
Hook executes
```

↓

```txt
Check cache
```

↓

If cached:

```txt
Return cache immediately
```

↓

If not cached:

```txt
Dispatch query action
```

↓

```txt
Middleware intercepts
```

↓

```txt
fetch()
```

↓

```txt
Response arrives
```

↓

```txt
Store in Redux cache
```

↓

```txt
Component re-renders
```

↓

```txt
data populated
```

---

# What values does the hook provide?

Initially:

```js
{
  data: undefined,
  isLoading: true,
  isError: false
}
```

After success:

```js
{
  data: [...products],
  isLoading: false,
  isError: false
}
```

After failure:

```js
{
  data: undefined,
  isLoading: false,
  isError: true,
  error: {...}
}
```

---

# Why this design is powerful

Traditional React:

```txt
useState
useEffect
axios
loading state
error state
cache
refetch logic
cleanup
```

RTK Query:

```js
const { data, isLoading, error } =
  useGetProductsQuery();
```

Everything else is handled by:

* Redux store
* RTK Query middleware
* cache engine
* subscriptions
* generated hooks
* automatic re-rendering

That's the fundamental architecture: **`createApi()` creates the API service, `injectEndpoints()` adds endpoints, the store activates RTK Query through reducer + middleware, and generated hooks let React components consume cached server data with almost no boilerplate.**
