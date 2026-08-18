import { vi } from 'vitest';

type QueryResult = { data: any; error: any };

// Minimal chainable mock for the subset of the supabase-js query builder this codebase
// uses (select/insert/update/delete/eq/in/order/single/maybeSingle). Every non-terminal
// method returns the same object so calls can be chained in any order; the object is also
// awaitable directly (supabase-js query builders resolve via `.then()` without requiring a
// terminal call), which is why `.then()` is implemented here too.
export function createMockQuery(result: QueryResult) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    upsert: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return query;
}

// Routes `supabase.from(table)` to a per-table canned result. Sufficient for the
// single-query-per-table-per-call patterns used in src/services/*.ts; if a test needs
// different results across repeated calls to the same table, mock `supabase.from`
// directly instead.
export function mockSupabaseFrom(resultsByTable: Record<string, QueryResult>) {
  return vi.fn((table: string) => {
    const result = resultsByTable[table];
    if (!result) {
      throw new Error(`mockSupabaseFrom: no result configured for table "${table}"`);
    }
    return createMockQuery(result);
  });
}
