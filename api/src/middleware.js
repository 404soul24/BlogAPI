/** Wraps an async route handler so rejected promises reach the error middleware. */
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Validates req.body against a zod schema and replaces it with the parsed value,
 * so handlers only ever see trimmed, typed, known fields.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      error: 'Validation failed.',
      fields: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  req.body = result.data;
  next();
};

/** Prisma's P2002 is a unique-constraint violation; P2025 is "record not found". */
export function errorHandler(err, _req, res, _next) {
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'That value is already taken.', fields: err.meta?.target });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Not found.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}
