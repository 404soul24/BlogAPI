# Blog

A blog built as three deployable apps in one monorepo.

| Directory       | What it is                                       | Port |
| --------------- | ------------------------------------------------ | ---- |
| `api/`          | Express REST API + Prisma + PostgreSQL + JWT auth | 4000 |
| `blog-client/`  | Public reader (React + Vite)                     | 5173 |
| `admin-client/` | Authoring and moderation (React + Vite)          | 5174 |
| `ui-kit/`       | Design tokens, primitives, shared API client     | —    |

## Setup

```bash
npm install

# create the database once
psql -U postgres -c "CREATE DATABASE blog"

cp .env.example api/.env       # then set DATABASE_URL and JWT_SECRET
npm run prisma:migrate -w api
npm run prisma:seed -w api
```

Seeded logins: `author@example.com` / `password123` (author),
`reader@example.com` / `password123` (reader).

Run all three apps:

```bash
npm run dev:api    # http://localhost:4000
npm run dev:blog   # http://localhost:5173
npm run dev:admin  # http://localhost:5174
```

## Data model

**Post** — `title`, `content`, `published` (boolean, indexed), `createdAt`,
`updatedAt`, `authorId`. Drafts exist in the database but are invisible to
readers: they 404 for anyone without an author token, and they are excluded from
the public list.

**Comment** — `content`, `createdAt`, `updatedAt`, `postId`, `userId`. Comments
require a logged-in account, so the commenter's name always comes from `User`
rather than a free-text field.

**User** — `name`, `email` (unique), `passwordHash`, `isAuthor`. The first
account to register becomes the author; everyone after that is a reader who can
comment but cannot create or edit posts.

## Auth

`POST /users/register` and `POST /users/login` return a JWT. The client stores
it in `localStorage` and sends it as `Authorization: Bearer <token>`. Logging out
clears the token client-side — JWTs are stateless, so there is no server-side
session to destroy.

Three middleware levels:

- public — no header required
- `requireAuth` — valid token or 401
- `requireAuthor` — valid token with `isAuthor`, or 403

## Endpoints

| Method   | Path                          | Auth           | Notes                                          |
| -------- | ----------------------------- | -------------- | ---------------------------------------------- |
| `GET`    | `/api/health`                 | —              |                                                |
| `POST`   | `/api/users/register`         | —              | First user becomes author                      |
| `POST`   | `/api/users/login`            | —              | 401 for bad email *or* bad password            |
| `GET`    | `/api/users/me`               | bearer         |                                                |
| `GET`    | `/api/posts`                  | optional       | Readers see published only; authors see all    |
| `GET`    | `/api/posts?published=false`  | author         | Draft filter, author only                      |
| `POST`   | `/api/posts`                  | author         | Defaults to `published: false`                 |
| `GET`    | `/api/posts/:id`              | optional       | Drafts 404 for non-authors                     |
| `PATCH`  | `/api/posts/:id`              | author         | Partial update; `{}` is a 422                  |
| `DELETE` | `/api/posts/:id`              | author         | Cascades to comments                            |
| `GET`    | `/api/posts/:id/comments`     | —              | Oldest first                                   |
| `POST`   | `/api/posts/:id/comments`     | bearer         | 404 on unpublished posts                       |
| `GET`    | `/api/comments`               | author         | All comments across posts, for moderation      |
| `GET`    | `/api/comments/:id`           | bearer         |                                                |
| `PATCH`  | `/api/comments/:id`           | owner/author   | 403 for other readers                          |
| `DELETE` | `/api/comments/:id`           | owner/author   |                                                |

Validation is zod at the boundary: bad input returns 422 with a `fields` array.
Duplicate email returns 409.

### Try it with curl

```bash
API=http://localhost:4000/api

TOKEN=$(curl -s -X POST $API/users/login \
  -H 'content-type: application/json' \
  -d '{"email":"author@example.com","password":"password123"}' | jq -r .token)

# create a draft
POST_ID=$(curl -s -X POST $API/posts -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"From curl","content":"Hello"}' | jq -r .post.id)

# publish it
curl -s -X PATCH $API/posts/$POST_ID -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"published":true}'

# it is now public
curl -s $API/posts/$POST_ID
```

## Tests

`npm run smoke` boots the app on an ephemeral port and walks the whole flow
end to end against the real database — registration, login, author permissions,
draft visibility, publish/unpublish, comment permissions, and cascade delete. It
cleans up the accounts it creates.

## Deploying

- **API** — any Node host (Render, Railway, Fly). Set `DATABASE_URL` and
  `JWT_SECRET`, run `npx prisma migrate deploy`, start with `npm start`. On
  Railway, `railway.json` at the repo root already runs the migration on every
  start.
- **Front-ends** — static builds (`npm run build` at the repo root) on Netlify,
  Vercel, or Pages. Set `VITE_API_URL` to the deployed API and redeploy — it is
  baked in at build time. The apps use hash routing, so no SPA rewrite rule is
  needed.

## Not built

Refresh tokens, markdown rendering, comment pagination, and rate limiting. Add
refresh tokens if sessions need to outlive a day; add pagination when a post
outgrows a few hundred comments.
