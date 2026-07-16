# Backend Audit Report

Audit date: 2026-07-16

Scope: `backend/` Node.js, Express, MongoDB/Mongoose API.

## Executive Summary

The backend is a modular Express application with route modules, controllers, a partial service layer, Mongoose models, file uploads, payment integration, CMS APIs, catalog APIs, orders, coupons, refunds, reviews, staff, roles, cart, and wallet APIs.

This pass focused on codebase-wide inspection and low-risk production hardening. I did not remove files or APIs where runtime usage could not be proven absent.

## Architecture Map

Request

-> Express server in `server.js`

-> Global middleware:

- JSON and URL-encoded body parsing
- CORS allowlist
- Static `/uploads` media serving
- No-cache API headers

-> Route module:

- `/api/auth` -> `routes/authRoutes.js`
- `/api/catalog` -> `routes/catalogRoutes.js`
- `/api/v2/catalog` -> `routes/catalogV2Routes.js`
- `/api/staff` -> `routes/staffRoutes.js`
- `/api/roles` -> `routes/roleRoutes.js`
- `/api/orders` -> `routes/orderRoutes.js`
- `/api/cart` -> `routes/cartRoutes.js`
- `/api/fees` -> `routes/feeRoutes.js`
- `/api/cancellation-rules` -> `routes/cancellationRoutes.js`
- `/api/refunds` -> `routes/refundRoutes.js`
- `/api/wallet` -> `routes/walletRoutes.js`
- `/api/payment` -> `routes/paymentRoutes.js`
- `/api/reviews` -> `routes/reviewRoutes.js`
- `/api/coupons` -> `routes/couponRoutes.js`
- `/api/cms` -> `routes/cmsRoutes.js`

-> Middleware:

- `protect` verifies JWT and loads `User` or `Staff`
- `authorize` checks allowed roles, with staff bypass for admin routes
- `validate` validates simple request schemas
- `auditContextMiddleware` attaches user, IP, and user-agent metadata

-> Controller:

- Auth, catalog, catalog v2, category, subcategory, attribute, product, variant, cart, order, coupon, CMS, Cashfree, review, refund, wallet, staff, role, fee, cancellation.

-> Service:

- Catalog v2 services for category, subcategory, attribute, product, audit
- Cashfree service

-> Model:

- Mongoose models in `models/` and `models/catalog/`

-> MongoDB

## Dependency Relationships

- `server.js` depends on DB config, route modules, seed attributes, `Order`, `Review`, `Module`, `Staff`.
- Route modules depend on controllers and middleware.
- Legacy catalog controllers directly depend on models.
- Catalog v2 controllers depend on services.
- Services depend on models and audit service.
- Payment controller depends on `cashfreeService` and `Order`.
- Utility modules support fee calculation, Cloudinary upload, wallet calculation, and variant generation.

## Request Lifecycle

1. Express receives request.
2. Body parser processes payload.
3. CORS middleware validates origin.
4. Static uploads are served before API no-cache headers.
5. Route module matches path and method.
6. Optional `protect` middleware validates JWT.
7. Optional `authorize` middleware checks role.
8. Optional validation middleware checks body or query.
9. Controller or service runs business logic.
10. Mongoose executes MongoDB query.
11. Controller returns JSON response.

## Changes Applied

### Security

- Protected unsafe legacy catalog routes with `protect` and `authorize('admin', 'staff')`.
- Protected catalog upload and delete routes.
- Protected product variant mutation routes.
- Protected CMS hero update route.
- Moved review admin routes before dynamic public review routes so `/admin/stats` is not swallowed by `/:productId/stats`.

### Database Indexes Added

- `Order`: `{ user, createdAt }`, `{ status, createdAt }`, `{ isPaid, createdAt }`, `{ isDelivered, createdAt }`, `{ coupon, couponConsumed }`
- `Coupon`: `{ status, visible, deleted, startDate, endDate }`, `{ category, subCategory, product }`
- `WalletTransaction`: `{ userId, createdAt }`, `{ status, createdAt }`, sparse `{ referenceId }`
- `Review`: `{ product, status, createdAt }`, `{ status, createdAt }`, `{ rating, status }`
- `Refund`: `{ orderRef }`, `{ status, createdAt }`, `{ refundActionStatus, createdAt }`
- `User`: `{ role, createdAt }`, sparse `{ resetPasswordToken }`, sparse `{ resetPasswordExpire }`
- `Cart`: `{ updatedAt }`

## Phase Findings

### Folder Structure

The project is organized by technical layer, but it is only partially service-oriented. `catalogV2` follows a cleaner route -> controller -> service -> model flow. Older modules keep business logic in controllers.

Recommended target:

```text
src/
  config/
  controllers/
  services/
  repositories/
  models/
  routes/
  middlewares/
  validators/
  utils/
  constants/
  jobs/
  docs/
  tests/
```

### Route Audit

Findings:

- Legacy `/api/catalog` had public mutation endpoints before this patch.
- `/api/catalog` and `/api/v2/catalog` duplicate category, subcategory, attribute, and product API surfaces.
- Review admin stats route was shadowed by a dynamic route before this patch.
- Several admin routes do not use standardized request validation.
- Response shapes are inconsistent across controllers.

Actions:

- Protected unsafe legacy catalog routes.
- Protected CMS hero update.
- Reordered review admin routes.

### Controller Audit

Large controllers exist:

- `orderController.js`
- `reviewController.js`
- `productController.js`
- `productVariantController.js`
- `cmsController.js`
- `categoryController.js`
- `attributeController.js`

Risk:

- Business logic, DB access, validation, and response formatting are mixed.
- Repeated try/catch blocks make error behavior inconsistent.

Recommendation:

- Move remaining legacy catalog/order/review/CMS logic into service modules.
- Introduce `asyncHandler`, `AppError`, and a global error handler.

### Service Layer Audit

Good pattern:

- `catalogV2Controller.js` delegates to service modules.

Issues:

- Most non-v2 modules do not have services.
- Repository pattern is absent.
- Some services still perform enrichment with repeated per-product queries.

### Database Audit

Observed risks:

- Product list enrichment in `productService.js` performs repeated queries per product for variants, images, and inventory.
- Category listing performs per-category product counts.
- Several read endpoints use `populate()` without consistently using `lean()` and projections.
- Some list endpoints need stronger pagination discipline.

Actions:

- Added query-aligned indexes for high-traffic order, coupon, review, wallet, refund, user, and cart access patterns.

### Populate Optimization

Observed:

- Populate is used in auth customer orders, catalog controllers, product services, refunds, payments, attributes, audit logs, and catalog controllers.

Recommendations:

- Keep projections on every populate.
- Add `lean()` on read-only list views.
- Replace repeated populate/enrichment loops with batched queries or aggregation.

### Security Audit

Strengths:

- JWT verification exists.
- Password hashing uses bcrypt.
- CORS allowlist exists.
- File uploads are routed through controller logic.

Critical issues:

- Legacy catalog writes were public before this patch.
- CMS hero update was public before this patch.
- No rate limiting.
- No Helmet security headers.
- No global NoSQL injection sanitizer.
- No centralized upload MIME/size policy documented in middleware.
- Staff authorization currently allows any staff through many admin routes once authenticated.
- Payment verification endpoint should be reviewed for provider signature verification and replay protection.

### Performance Audit

Main issues:

- N+1 style enrichment in product and category flows.
- Missing bulk read pattern in several list APIs.
- No response compression.
- No cache strategy for frequently read CMS/catalog data.
- Startup performs seed/index/drop-index work inside the web process.

### Error Handling

Current:

- Controllers use many local try/catch blocks.
- No global error handler is registered after routes.
- Error response format varies.

Recommendation:

- Add `utils/asyncHandler.js`
- Add `utils/AppError.js`
- Add `middleware/errorMiddleware.js`
- Convert controllers gradually.

### Logging

Current:

- Uses `console.log`, `console.warn`, and `console.error`.

Recommendation:

- Add structured logger.
- Include request IDs.
- Redact secrets and tokens.
- Separate startup, request, audit, payment, and error logs.

### Validation

Current:

- `validateMiddleware.js` provides a simple schema validator.
- Catalog v2 uses it.
- Many legacy endpoints do not validate body, params, and query consistently.

Recommendation:

- Centralize validators by route domain.
- Validate `params`, `query`, and `body`.
- Enforce Mongo ObjectId validation before DB calls.

### Config and Dependencies

Dependencies:

- `bcryptjs`
- `cashfree-pg`
- `cloudinary`
- `cors`
- `dotenv`
- `express`
- `jsonwebtoken`
- `mongoose`
- `multer`

Recommendations:

- Add `helmet` and rate limiter.
- Add a production logger such as `pino`.
- Replace placeholder `npm test` script with a real test command.
- Move one-off scripts into `scripts/`.
- Keep `.env` out of source control and document required variables in `.env.example`.

### Dead Code and Cleanup

Likely cleanup candidates:

- One-off scripts in backend root: `check*.js`, `fix*.js`, `map*.js`, `update*.js`, `clear-products.js`, `test_pos.js`, seed scripts.
- Debug/output files: `debug_hero.txt`, `products_response.json`, `backend.log`.
- Postman collections should move to `docs/postman/`.

No files were removed in this pass because runtime references and operational usage were not fully provable absent.

## Final Scores

- Security: 6.5/10 after this patch, previously lower due to public mutation routes.
- Performance: 6/10.
- Code quality: 6/10.
- Scalability: 6/10.
- Maintainability: 6/10.

## Final Change Ledger

- Files removed: none.
- APIs removed: none.
- Services removed: none.
- Controllers refactored: none in this pass.
- Routes optimized: legacy catalog auth, CMS hero auth, review admin route order.
- Queries optimized: indexes added for high-use query patterns.
- Indexes added: 21 declared index definitions across 7 models.
- N+1 issues fixed: none yet, identified for product/category flows.
- Memory improvements: route-level auth reduces unintended write traffic; no memory refactor yet.
- Speed improvements: index-backed order/review/coupon/wallet/refund/user/cart lookups.
- Security improvements: protected public write surfaces and fixed route shadowing.
- Folder improvements: documented target structure; no migration performed in this pass.
- Estimated response time improvement: moderate on indexed list/detail queries once indexes are built.
- Estimated MongoDB query improvement: high for order history, admin order lists, review lists, coupon eligibility/admin filters, and wallet history.
- Estimated hosting cost reduction: small to moderate after indexes reduce collection scans.
- Estimated scalability improvement: moderate for read-heavy admin/storefront flows.

## Next Priority Backlog

1. Add global error handler and standardized response helpers.
2. Add Helmet and rate limiting.
3. Convert legacy catalog controllers to use the catalog v2 service style.
4. Batch product list enrichment queries.
5. Add real backend tests for auth, catalog writes, order creation, payment verification, coupons, and reviews.
6. Move startup seed/index maintenance out of `server.js`.
7. Split scripts, docs, uploads, and runtime logs away from application source.
