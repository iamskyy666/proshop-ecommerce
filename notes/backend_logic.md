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

# What Problem Does JWT Solve? 🔏

Imagine our login endpoint:

```http
POST /api/users/login
```

User sends:

```json
{
  "email": "admin@email.com",
  "password": "123456"
}
```

We verify:

```js
const user = await User.findOne({ email });

if (user && await user.matchPassword(password)) {
  // success
}
```

The question becomes:

> How does our server know who the user is on the next request?

Suppose the user logs in and then requests:

```http
GET /api/users/profile
```

How does the server know:

```text
This is Admin User
```

and not:

```text
This is John Doe
```

JWT solves this problem.

---

# What Is JWT?

JWT stands for:

```text
JSON Web Token
```

It is a signed string that contains information about a user.

Example:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Looks like gibberish.

The server creates it.

The client stores it.

The client sends it back on future requests.

The server verifies it.

---

# Traditional Session Authentication

Before JWT became popular:

```text
User Login
     │
     ▼
Server creates Session
     │
     ▼
Stores Session in Database
     │
     ▼
Browser gets Session ID Cookie
```

Database:

```text
sessions
├── abc123 -> user1
├── xyz999 -> user2
```

Every request:

```text
Cookie: session=abc123
```

Server looks up:

```text
abc123
```

in database.

---

JWT removes this lookup.

---

# JWT Authentication

Instead of storing sessions:

```text
User Login
     │
     ▼
Server creates JWT
     │
     ▼
Browser stores JWT
     │
     ▼
Browser sends JWT on requests
     │
     ▼
Server verifies signature
```

No session table required.

This is called:

```text
Stateless Authentication
```

because the server doesn't need to remember logged-in users.

---

# Anatomy of a JWT

JWT has 3 parts:

```text
HEADER.PAYLOAD.SIGNATURE
```

Example:

```text
xxxxx.yyyyy.zzzzz
```

---

## Part 1: Header

Example:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Meaning:

```text
Algorithm = HS256
Type = JWT
```

---

## Part 2: Payload

Contains data.

Example:

```json
{
  "id": "64a12345",
  "email": "admin@email.com"
}
```

This is called the:

```text
Claim
```

or payload.

---

## Part 3: Signature

Created using:

```text
Header
+
Payload
+
Secret Key
```

Example:

```text
MY_SUPER_SECRET_KEY
```

Only the server knows this secret.

This prevents tampering.

---

# Why Signature Matters

Suppose user changes:

```json
{
  "isAdmin": false
}
```

to

```json
{
  "isAdmin": true
}
```

The signature immediately becomes invalid.

Server detects tampering.

Request is rejected.

---

# JWT Creation

In Node.js:

```js
import jwt from "jsonwebtoken";

const token = jwt.sign(
  {
    id: user._id,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "30d",
  }
);
```

Example result:

```text
eyJhbGciOiJIUzI1NiIs...
```

---

# What Are We Putting Inside?

Usually:

```js
{
  id: user._id
}
```

Not:

```js
{
  password: user.password
}
```

Never place passwords inside JWTs.

---

# Why Store Only User ID?

Because later:

```js
const decoded = jwt.verify(token, JWT_SECRET);
```

returns:

```js
{
  id: "64a12345"
}
```

Then:

```js
const user = await User.findById(decoded.id);
```

Simple.

---

# Login Flow

Step 1

User submits:

```json
{
  "email": "admin@email.com",
  "password": "123456"
}
```

---

Step 2

Server verifies credentials.

---

Step 3

Generate token:

```js
const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
);
```

---

Step 4

Send token.

Example:

```json
{
  "_id": "...",
  "name": "Admin",
  "token": "eyJhb..."
}
```

or set an HTTP-only cookie.

---

# Future Requests

Client sends:

```http
Authorization: Bearer eyJhb...
```

or cookie.

---

Server receives:

```http
GET /api/users/profile
```

with token.

---

# Verify JWT

Middleware:

```js
const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);
```

If valid:

```js
{
  id: "64a12345"
}
```

If invalid:

```text
JsonWebTokenError
```

---

# Protect Middleware

Soon we'll write something like:

```js
const protect = asyncHandler(async (
  req,
  res,
  next
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token =
      req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = await User.findById(decoded.id);

    next();
  } else {
    res.status(401);
    throw new Error("Not authorized");
  }
});
```

---

# What Happens Here?

Request:

```http
GET /api/users/profile
Authorization: Bearer eyJhb...
```

↓

Extract token

↓

Verify token

↓

Get user ID

↓

Find user in DB

↓

Attach user:

```js
req.user
```

↓

Continue route

---

Now controller can use:

```js
req.user._id
```

without querying login credentials again.

---

# Why Not Trust Frontend?

Bad:

```json
{
  "userId": "admin123"
}
```

Anyone can fake that.

JWT allows verification:

```text
Did OUR server create this token?
```

If yes:

```text
Trust it
```

If no:

```text
Reject it
```

---

# JWT Expiration

Example:

```js
expiresIn: "30d"
```

JWT contains expiration:

```json
{
  "exp": 1750000000
}
```

After expiry:

```js
jwt.verify(...)
```

throws:

```text
TokenExpiredError
```

User must log in again.

---

# JWT in Local Storage vs Cookies

## Local Storage

```js
localStorage.setItem("token", token);
```

Pros:

* Easy

Cons:

* Vulnerable to XSS attacks

---

## HTTP-only Cookie

Modern preferred approach.

Server:

```js
res.cookie("jwt", token, {
  httpOnly: true,
});
```

Browser stores automatically.

JavaScript cannot read it.

Safer.

This is what newer versions of ProShop use.

---

# JWT Secret

Never:

```env
JWT_SECRET=123
```

Use:

```env
JWT_SECRET=sdf89sdf98sdf8sdf9sdf89sdf98sdf
```

Long and random.

If attackers know the secret:

```text
Game Over
```

They can forge tokens.

---

# Authentication vs Authorization

JWT handles:

```text
Authentication
```

Meaning:

```text
Who are we?
```

Example:

```text
Skyy logged in successfully.
```

---

Then authorization checks permissions:

```js
if (!req.user.isAdmin) {
   throw new Error("Not authorized");
}
```

Meaning:

```text
Can we perform this action?
```

Example:

```text
Admin -> delete product
User -> cannot delete product
```

---

# How We'll we used JWT in ProShop

Our flow:

```text
Login
   │
   ▼
Verify Email + Password
   │
   ▼
Generate JWT
   │
   ▼
Store JWT in HTTP-only cookie
   │
   ▼
Protected Request
   │
   ▼
Protect Middleware
   │
   ▼
jwt.verify()
   │
   ▼
Find User
   │
   ▼
req.user
   │
   ▼
Controller Executes
```

That's the complete JWT authentication lifecycle we'll build in the MERN backend. Once we understand this flow, the actual implementation in Express becomes much easier because every piece has a specific responsibility: login creates the token, middleware verifies it, and controllers use the authenticated user attached to `req.user`.
