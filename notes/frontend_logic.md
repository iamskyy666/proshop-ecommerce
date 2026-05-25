# 1. What Problem Does Redux Solve?

Imagine an e-commerce app:

```text
App
│
├── Header
│   └── Cart Badge
│
├── Product Screen
│   └── Add To Cart Button
│
├── Cart Screen
│
└── Checkout Screen
```

Suppose a user adds a product to the cart.

The cart data is needed in:

* Header (cart count)
* Cart page
* Checkout page
* Payment page

Without Redux, we'd have to pass state through many components:

```jsx
<App cart={cart}>
  <Header cart={cart}/>
  <Home cart={cart}/>
</App>
```

This is called:

```text
Prop Drilling
```

Passing data through components that don't even use it.

Redux solves this by creating a **centralized store**.

```text
          Redux Store
                │
      ┌─────────┼─────────┐
      │         │         │
   Header     Cart     Checkout
```

Any component can access shared state directly.

---

# 2. What Is Redux?

Redux is a predictable state container.

Think of it as:

```text
Global Memory
```

for the application.

Example:

```js
{
  cart: [],
  user: null,
  products: [],
  loading: false
}
```

Instead of each component owning data separately:

```jsx
const [cart, setCart] = useState([]);
```

Redux stores everything in one place.

---

# 3. What Was Wrong With Traditional Redux?

Old Redux required lots of boilerplate.

Example:

### Action Types

```js
export const ADD_TO_CART =
'ADD_TO_CART';
```

---

### Actions

```js
export const addToCart = product => ({
 type: ADD_TO_CART,
 payload: product
});
```

---

### Reducers

```js
function cartReducer(
 state=[],
 action
){
 switch(action.type){

   case ADD_TO_CART:
     return [
       ...state,
       action.payload
     ];

   default:
     return state;
 }
}
```

---

### Store

```js
createStore(...)
```

Huge amount of setup.

Redux Toolkit was created to simplify Redux.

---

# 4. What Is Redux Toolkit?

Official Redux team recommendation:

> Use Redux Toolkit instead of plain Redux.

Official site:

[Redux Toolkit Documentation](https://redux-toolkit.js.org?utm_source=chatgpt.com)

RTK removes most Redux boilerplate.

---

Install:

```bash
npm install @reduxjs/toolkit react-redux
```

---

# 5. Core Concepts

There are five fundamental concepts:

```text
Store
State
Actions
Reducers
Dispatch
```

Everything revolves around these.

---

# 6. State

State is data.

Example:

```js
{
  cartItems: [],
  shippingAddress: {},
  userInfo: null
}
```

State = current application data.

---

# 7. Action

Action describes what happened.

Example:

```js
{
 type: "cart/addItem",
 payload: product
}
```

Meaning:

```text
User added item to cart
```

Action = event.

---

# 8. Reducer

Reducer updates state.

Example:

```js
(state, action) => {
 state.cartItems.push(
   action.payload
 )
}
```

Reducer receives:

```text
Current State
+
Action
```

and returns:

```text
New State
```

---

# 9. Dispatch

Dispatch sends an action.

Example:

```js
dispatch(addToCart(product))
```

Think:

```text
Dispatch
   ↓
Action
   ↓
Reducer
   ↓
New State
```

---

# Complete Flow

```text
User Clicks Add To Cart
          │
          ▼
dispatch(addToCart())
          │
          ▼
Reducer Runs
          │
          ▼
Store Updates
          │
          ▼
UI Re-renders
```

This cycle is Redux.

---

# 10. Store

Store holds all application state.

Example:

```js
{
 cart:{},
 user:{},
 products:{}
}
```

Only one store usually exists.

---

# 11. Creating a Store

```js
import {
 configureStore
}
from '@reduxjs/toolkit';
```

---

Example:

```js
export const store =
 configureStore({
   reducer:{}
 });
```

RTK replaces old:

```js
createStore()
```

with:

```js
configureStore()
```

which automatically adds:

* DevTools
* Middleware
* Good defaults

---

# 12. Slice

The most important RTK concept.

A Slice represents one piece of state.

Example:

```text
cartSlice
userSlice
productSlice
orderSlice
```

Each manages a specific domain.

---

# Creating a Slice

```js
import {
 createSlice
}
from '@reduxjs/toolkit';
```

---

Example:

```js
const cartSlice =
 createSlice({
   name:'cart',

   initialState:{
     cartItems:[]
   },

   reducers:{}
 });
```

---

# initialState

Starting data.

```js
initialState:{
 cartItems:[]
}
```

Means:

```text
Cart starts empty
```

---

# Reducers Inside Slice

Example:

```js
reducers:{
 addToCart:(state,action)=>{
   state.cartItems.push(
      action.payload
   );
 }
}
```

---

Looks like mutation:

```js
state.cartItems.push(...)
```

Normally Redux forbids mutation.

But RTK uses:

Immer

internally.

Immer converts mutations into immutable updates automatically.

So this:

```js
state.cartItems.push(item)
```

becomes a safe immutable update.

---

# Generated Actions

RTK automatically creates actions.

Example:

```js
export const {
 addToCart
}
=
cartSlice.actions;
```

No need to write action creators manually.

Huge reduction in code.

---

# Export Reducer

```js
export default
cartSlice.reducer;
```

This reducer goes into the store.

---

# Store Setup

```js
import cartReducer
from './cartSlice';
```

```js
export const store =
configureStore({

 reducer:{
   cart:cartReducer
 }

});
```

State becomes:

```js
{
 cart:{
   cartItems:[]
 }
}
```

---

# Providing Store To React

```jsx
import { Provider }
from 'react-redux';
```

```jsx
<Provider store={store}>
   <App/>
</Provider>
```

Now every component can access Redux.

---

# useSelector

Read data from store.

```js
import {
 useSelector
}
from 'react-redux';
```

Example:

```js
const cart =
 useSelector(
   state=>state.cart
 );
```

Gets cart state.

---

Specific value:

```js
const cartItems =
 useSelector(
  state=>state.cart.cartItems
 );
```

---

# useDispatch

Send actions.

```js
import {
 useDispatch
}
from 'react-redux';
```

```js
const dispatch =
 useDispatch();
```

---

Dispatch action:

```js
dispatch(
 addToCart(product)
);
```

---

# Async Redux

Real applications call APIs.

Example:

```text
GET /api/products
POST /api/login
POST /api/orders
```

Async operations need special handling.

---

# createAsyncThunk

RTK's async helper.

Example:

```js
import {
 createAsyncThunk
}
from '@reduxjs/toolkit';
```

---

Fetch products:

```js
export const fetchProducts =
 createAsyncThunk(
   'products/fetch',
   async ()=>{
      const res =
       await fetch('/api/products');

      return await res.json();
   }
 );
```

---

Flow:

```text
Dispatch Thunk
      │
      ▼
Pending
      │
      ▼
Success
or
Failure
```

---

RTK automatically creates:

```text
products/fetch/pending
products/fetch/fulfilled
products/fetch/rejected
```

actions.

---

# extraReducers

Handle async actions.

```js
extraReducers:(builder)=>{

 builder.addCase(
  fetchProducts.pending,
  state=>{
   state.loading=true;
  }
 );

 builder.addCase(
  fetchProducts.fulfilled,
  (state,action)=>{
    state.loading=false;
    state.products=
      action.payload;
  }
 );

 builder.addCase(
  fetchProducts.rejected,
  state=>{
    state.loading=false;
    state.error=true;
  }
 );
}
```

---

# Typical Loading State

```js
{
 loading:true,
 products:[],
 error:null
}
```

---

UI:

```jsx
if(loading){
 return <Spinner/>
}
```

---

# Middleware

Middleware sits between:

```text
Dispatch
   ↓
Middleware
   ↓
Reducer
```

Used for:

* Logging
* Async requests
* Analytics
* Error handling

RTK automatically includes:

```text
Redux Thunk Middleware
```

---

# RTK Query

The most advanced RTK feature.

RTK Query handles:

* API requests
* Caching
* Refetching
* Loading states
* Error states

automatically.

Official docs:

[RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview?utm_source=chatgpt.com)

---

Traditional:

```js
useEffect(()=>{
 fetch(...)
},[])
```

RTK Query:

```js
const {
 data,
 error,
 isLoading
}
=
useGetProductsQuery();
```

Much less code.

---

# Why E-Commerce Tutorials Use Redux Toolkit

A store commonly contains:

```js
{
 cart:{},
 user:{},
 productList:{},
 productDetails:{},
 orderCreate:{},
 orderDetails:{},
 payment:{}
}
```

Shared across many pages.

Redux Toolkit keeps this organized.

---

Our MERN e-commerce project uses **react-router-dom v6.10.0**, We'll focus on **v6-style routing** rather than newer v7 features.

---

# What is React Router?

React is a **Single Page Application (SPA)** framework.

Without a router:

```text
example.com
```

always renders the same React app.

To display different pages:

```text
/
 /products
 /product/123
 /cart
 /login
```

React needs a routing system.

That's what **React Router DOM** provides.

It maps URLs to React components.

---

# Why do we need it?

Traditional websites:

```text
GET /
GET /about
GET /contact
```

The server returns a completely new HTML page each time.

---

React SPA:

```text
/
```

loads once.

After that:

```text
/about
/contact
```

are handled by JavaScript without reloading the browser.

This makes navigation:

* Faster
* Smoother
* More app-like

---

# Installation

```bash
npm install react-router-dom@6.10.0
```

---

# Core Components

In v6.10.0 we'll use these constantly:

```jsx
BrowserRouter
Routes
Route
Link
NavLink
Navigate
Outlet
useNavigate
useParams
useLocation
useSearchParams
```

---

# BrowserRouter

The root router.

Usually in:

```jsx
main.jsx
```

or

```jsx
index.js
```

Example:

```jsx
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

---

What BrowserRouter does:

It listens for URL changes.

Example:

```text
localhost:3000/
localhost:3000/login
localhost:3000/cart
```

and tells React which component should render.

---

# Routes

Routes is a container for Route components.

```jsx
<Routes>
</Routes>
```

Think:

```text
Route registry
```

or

```text
List of possible pages
```

---

# Route

Defines which component should render for a path.

Example:

```jsx
<Routes>

  <Route
    path="/"
    element={<HomeScreen />}
  />

  <Route
    path="/login"
    element={<LoginScreen />}
  />

</Routes>
```

---

Meaning:

```text
/       -> HomeScreen
/login  -> LoginScreen
```

---

# element Prop

Old v5:

```jsx
<Route component={HomeScreen}/>
```

v6:

```jsx
<Route element={<HomeScreen />} />
```

Notice:

```jsx
<HomeScreen />
```

is an actual JSX element.

---

# Route Matching

Example:

```jsx
<Route
 path="/about"
 element={<AboutPage />}
/>
```

URL:

```text
/about
```

renders:

```jsx
<AboutPage />
```

---

Any other URL:

```text
/contact
```

won't match.

---

# Nested Routes

One of the biggest improvements in v6.

Example:

```jsx
<Route path="/" element={<Layout />}>

  <Route
    index
    element={<Home />}
  />

  <Route
    path="products"
    element={<Products />}
  />

</Route>
```

---

Structure:

```text
Layout
 ├─ Home
 └─ Products
```

---

Layout remains visible while children change.

Common for:

```text
Navbar
Footer
Sidebar
```

---

# Outlet

Outlet renders child routes.

Example:

```jsx
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <Navbar />

      <Outlet />

      <Footer />
    </>
  );
}
```

---

Without Outlet:

Child routes never appear.

Think:

```text
Outlet = placeholder
```

for nested pages.

---

# Link

Never use:

```jsx
<a href="/login">
```

inside React Router apps.

Why?

Because it reloads the page.

---

Use:

```jsx
import { Link } from "react-router-dom";

<Link to="/login">
  Login
</Link>
```

---

Generated HTML:

```html
<a href="/login">
```

But React intercepts the click and performs client-side navigation.

No page refresh.

---

# NavLink

Special version of Link.

Automatically knows whether it is active.

Example:

```jsx
<NavLink to="/login">
  Login
</NavLink>
```

---

Useful for navigation bars.

Example:

```text
Home
Products
Cart
```

Current page gets active styling.

---

# Dynamic Routes

Very important in e-commerce.

Example:

```jsx
<Route
 path="/product/:id"
 element={<ProductScreen />}
/>
```

---

Meaning:

```text
/product/1
/product/2
/product/999
```

all use the same component.

---

# useParams

Reads route parameters.

Example URL:

```text
/product/123
```

Route:

```jsx
<Route
 path="/product/:id"
 element={<ProductScreen />}
/>
```

Inside ProductScreen:

```jsx
import { useParams } from "react-router-dom";

function ProductScreen() {
  const params = useParams();

  console.log(params);
}
```

Result:

```js
{
  id: "123"
}
```

---

Destructuring:

```jsx
const { id } = useParams();
```

Now:

```jsx
console.log(id);
```

outputs:

```text
123
```

---

This is heavily used in MERN projects:

```jsx
fetch(`/api/products/${id}`)
```

---

# useNavigate

Programmatic navigation.

Equivalent to:

```text
redirect user
```

---

Example:

```jsx
import { useNavigate } from "react-router-dom";

function Login() {

 const navigate = useNavigate();

 const submitHandler = () => {
   navigate("/");
 };

}
```

---

After login:

```text
/login
```

becomes:

```text
/
```

without reload.

---

Navigate to product:

```jsx
navigate(`/product/${id}`);
```

---

Go back:

```jsx
navigate(-1);
```

Same as browser Back button.

---

Go forward:

```jsx
navigate(1);
```

---

Replace history:

```jsx
navigate("/", {
 replace: true
});
```

Useful after login.

Prevents:

```text
Back -> Login page
```

---

# Navigate Component

Declarative redirect.

Example:

```jsx
import { Navigate } from "react-router-dom";

if (!userInfo) {
  return <Navigate to="/login" />;
}
```

---

Meaning:

```text
Not logged in?
Go to login page.
```

Common in protected routes.

---

# useLocation

Returns current URL information.

Example:

```jsx
const location = useLocation();
```

---

Current URL:

```text
/cart?qty=2
```

returns:

```js
{
 pathname: "/cart",
 search: "?qty=2"
}
```

---

Useful for:

* analytics
* redirects
* breadcrumbs

---

# Query Parameters

URL:

```text
/search?keyword=iphone
```

Query string:

```text
keyword=iphone
```

---

# useSearchParams

Reads query parameters.

Example:

```jsx
const [searchParams] =
 useSearchParams();
```

---

Read:

```jsx
searchParams.get("keyword");
```

returns:

```text
iphone
```

---

URL:

```text
?page=3
```

returns:

```jsx
searchParams.get("page")
```

↓

```text
3
```

---

Used heavily for:

* pagination
* search
* filtering

---

# Index Routes

Instead of:

```jsx
<Route
 path=""
 element={<Home />}
/>
```

v6 prefers:

```jsx
<Route
 index
 element={<Home />}
/>
```

Meaning:

Default child route.

---

# Wildcard Routes

Catch unknown URLs.

```jsx
<Route
 path="*"
 element={<NotFound />}
/>
```

Example:

```text
/random-page
```

renders:

```jsx
<NotFound />
```

---

# Route Ranking

v6 automatically chooses the most specific route.

Example:

```jsx
<Route path="/product/new" />
<Route path="/product/:id" />
```

URL:

```text
/product/new
```

Correctly matches:

```text
/product/new
```

instead of:

```text
id = new
```

No manual ordering needed.

---

# Typical MERN E-commerce Routing

```jsx
<Routes>

<Route
 path="/"
 element={<HomeScreen />}
/>

<Route
 path="/product/:id"
 element={<ProductScreen />}
/>

<Route
 path="/cart"
 element={<CartScreen />}
/>

<Route
 path="/login"
 element={<LoginScreen />}
/>

<Route
 path="/register"
 element={<RegisterScreen />}
/>

<Route
 path="*"
 element={<NotFound />}
/>

</Routes>
```

---

# Navigation Flow

Example:

Home:

```text
/
```

↓

Click Product Card

```text
/product/123
```

↓

Add to Cart

```text
/cart
```

↓

Login

```text
/login
```

↓

Checkout

```text
/shipping
```

All without reloading the page.

That's the main power of React Router.

---

# Most Important Things to Master First

For our MERN e-commerce project, we'll focus on these in order:

1. `BrowserRouter`
2. `Routes`
3. `Route`
4. `Link`
5. `useParams`
6. `useNavigate`
7. `Navigate`
8. `useLocation`
9. `useSearchParams`
10. `Outlet`

Once these ten concepts are comfortable, we'll understand almost everything commonly used from **react-router-dom v6.10.0** in real-world MERN applications.
