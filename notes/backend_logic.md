# MW - notFound(), errorHandler(), asyncHandler() 🟢

These three pieces work together as a complete **Express error handling system**.

When we're done understanding them, we'll understand:

```text
Request
   ↓
Route Handler
   ↓
Success Response

OR

Route Handler
   ↓
Error Occurs
   ↓
asyncHandler
   ↓
errorHandler
   ↓
JSON Error Response
```

Let's go step-by-step.

---

# 1. The Problem We're Solving

Suppose we have:

```js
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  res.json(product);
};
```

Looks fine.

But what if MongoDB throws?

Example:

```http
GET /api/products/abc
```

where:

```text
abc
```

is not a valid MongoDB ObjectId.

Then:

```js
await Product.findById("abc")
```

throws:

```js
CastError
```

Without handling:

```text
Server crashes
OR
Unhandled Promise Rejection
```

which is bad.

We need a centralized way to handle errors.

That's exactly what these three middlewares provide.

---

# Middleware #1

# asyncHandler

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

This is the most confusing one initially.

Let's simplify it.

---

## What problem does it solve?

Normally:

```js
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.json(product);
  } catch (error) {
    next(error);
  }
};
```

Every route needs:

```js
try
catch
```

Repeated endlessly.

Example:

```js
try {}
catch {}
```

```js
try {}
catch {}
```

```js
try {}
catch {}
```

Lots of boilerplate.

---

## asyncHandler removes this repetition

Instead:

```js
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  res.json(product);
});
```

No try/catch.

Cleaner.

---

# How does asyncHandler actually work?

Suppose:

```js
const myFunction = async (req, res) => {
  throw new Error("Boom!");
};
```

Now:

```js
asyncHandler(myFunction)
```

becomes:

```js
(req, res, next) => {
  Promise.resolve(
    myFunction(req, res, next)
  ).catch(next);
}
```

---

## Step-by-step

Request arrives:

```http
GET /api/products/123
```

Express executes:

```js
myFunction(req, res, next)
```

Inside:

```js
throw new Error("Boom!");
```

Async functions automatically return:

```js
Promise.reject(error)
```

Then:

```js
Promise.resolve(...)
  .catch(next)
```

captures the error.

And does:

```js
next(error)
```

which sends it to Express error middleware.

---

So:

```text
Error
 ↓
Promise rejected
 ↓
.catch(next)
 ↓
Express Error Middleware
```

That's the entire purpose of asyncHandler.

---

# Why Promise.resolve?

```js
Promise.resolve(fn(req,res,next))
```

ensures:

```text
Returned value
or
Promise
```

both become a Promise.

So:

```js
Promise.resolve(...)
```

can always safely use:

```js
.catch(...)
```

afterwards.

---

# Middleware #2

# notFound Middleware

```js
const notFound = (req, res, next) => {
  const error = new Error(
    `Not Found - ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};
```

Purpose:

```text
Handle routes that don't exist
```

---

Suppose we only have:

```http
/api/products
/api/users
```

User requests:

```http
/api/banana
```

No matching route exists.

Express reaches the end of routing stack.

Then:

```js
app.use(notFound);
```

runs.

---

Let's follow execution.

Request:

```http
GET /api/banana
```

---

## req.originalUrl

Contains:

```js
req.originalUrl
```

↓

```text
/api/banana
```

---

Creates:

```js
const error =
  new Error("Not Found - /api/banana");
```

Now:

```js
error.message
```

equals:

```text
Not Found - /api/banana
```

---

Then:

```js
res.status(404);
```

sets:

```http
HTTP 404
```

but does NOT send response yet.

---

Then:

```js
next(error);
```

passes the error to the error middleware.

---

Flow:

```text
Unknown Route
      ↓
notFound
      ↓
404 status
      ↓
next(error)
      ↓
errorHandler
```

---

# Middleware #3

# errorHandler

```js
const errorHandler =
(err, req, res, next) => {
```

Notice:

```js
(err, req, res, next)
```

FOUR parameters.

This is special.

Express recognizes:

```js
(err, req, res, next)
```

as an error middleware.

---

Normal middleware:

```js
(req, res, next)
```

Error middleware:

```js
(err, req, res, next)
```

---

# Determining Status Code

```js
let statusCode =
  res.statusCode === 200
    ? 500
    : res.statusCode;
```

Suppose:

```js
throw new Error("Something broke");
```

without setting status.

Response still:

```text
200
```

which would be wrong.

So:

```js
200
```

becomes:

```text
500 Internal Server Error
```

---

Examples:

If route already set:

```js
res.status(404)
```

then:

```js
statusCode = 404
```

remains.

---

If route didn't set status:

```js
statusCode = 500
```

automatic server error.

---

# Message

```js
let message = err.message;
```

Gets:

```text
Resource not found
```

or

```text
Validation failed
```

or whatever error occurred.

---

# CastError Handling

This is extremely useful.

Code:

```js
if (
  err.name === "CastError" &&
  err.kind === "ObjectId"
)
```

---

Suppose request:

```http
GET /api/products/abc
```

MongoDB expects:

```text
68310c7a7df...
```

valid ObjectId.

Instead gets:

```text
abc
```

Mongoose throws:

```js
{
  name: "CastError",
  kind: "ObjectId"
}
```

---

Without custom handling:

Client sees:

```text
Cast to ObjectId failed
```

ugly database error.

---

Instead:

```js
message = "Resource not found!";
statusCode = 404;
```

Much cleaner.

Client receives:

```json
{
  "message": "Resource not found!"
}
```

---

# Final JSON Response

```js
res.status(statusCode).json({
  message,
  stack:
    process.env.NODE_ENV === "production"
      ? "🥞"
      : err.stack,
});
```

---

Suppose development mode:

```env
NODE_ENV=development
```

Response:

```json
{
  "message": "Resource not found!",
  "stack": "Error: Resource not found...\n..."
}
```

Useful while debugging.

---

Production mode:

```env
NODE_ENV=production
```

Response:

```json
{
  "message": "Resource not found!",
  "stack": "🥞"
}
```

No internal details exposed.

Safer.

---

# Understanding This Route

```js
const getProductById =
asyncHandler(async (req, res) => {
```

Request:

```http
GET /api/products/68310c7a
```

---

Database lookup:

```js
const product =
 await Product.findById(req.params.id);
```

---

Case 1: Product Exists

```js
if (product)
```

true.

Response:

```js
return res.json(product);
```

Client receives product data.

Done.

---

Case 2: Product Doesn't Exist

```js
res.status(404);

throw new Error(
  "Resource not found!"
);
```

This is clever.

---

First:

```js
res.status(404)
```

sets status.

Then:

```js
throw new Error(...)
```

throws error.

---

Normally async functions return:

```js
Promise.reject(error)
```

which is caught by:

```js
asyncHandler
```

↓

```js
.catch(next)
```

↓

```js
next(error)
```

↓

```js
errorHandler
```

↓

```json
{
  "message":"Resource not found!"
}
```

---

# Complete Flow Diagram

Successful request:

```text
Request
   ↓
Route Handler
   ↓
MongoDB
   ↓
Product Found
   ↓
res.json(product)
```

---

Missing product:

```text
Request
   ↓
Route Handler
   ↓
MongoDB
   ↓
No Product
   ↓
throw Error
   ↓
asyncHandler
   ↓
next(error)
   ↓
errorHandler
   ↓
404 JSON Response
```

---
