/**
 * Supabase stub — legacy compatibility layer.
 * All data access has been migrated to PostgreSQL via Drizzle ORM.
 * This stub prevents crashes when old code still imports supabase.
 */
const makeChainable = (): any => new Proxy({}, {
  get: (_t, _k) => (..._args: any[]) => makeChainable(),
});

export const supabase: any = {
  from: (_table: string) => makeChainable(),
  auth: makeChainable(),
  storage: makeChainable(),
};

export default supabase;
