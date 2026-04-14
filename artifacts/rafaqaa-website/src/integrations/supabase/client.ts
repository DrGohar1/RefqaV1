import api from "@/lib/api-client";

export const supabase = {
  auth: {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      api.get("/auth/me")
        .then((data: any) => {
          if (data?.user) {
            callback("SIGNED_IN", { user: data.user });
          } else {
            callback("SIGNED_OUT", null);
          }
        })
        .catch(() => callback("SIGNED_OUT", null));
      return { data: { subscription: { unsubscribe: () => {} } } };
    },

    getSession: async () => {
      try {
        const data: any = await api.get("/auth/me");
        if (data?.user) {
          return { data: { session: { user: data.user } }, error: null };
        }
      } catch {}
      return { data: { session: null }, error: null };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const data: any = await api.post("/auth/login", { username: email, password });
        return { data: { user: data.user, session: { user: data.user } }, error: null };
      } catch (e: any) {
        return { data: null, error: { message: e.message } };
      }
    },

    signUp: async ({ email, password, options }: any) => {
      return { data: null, error: { message: "التسجيل غير متاح. يُرجى التواصل مع الإدارة." } };
    },

    signOut: async () => {
      try {
        await api.post("/auth/logout", {});
        return { error: null };
      } catch (e: any) {
        return { error: { message: e.message } };
      }
    },

    resetPasswordForEmail: async (email: string, opts?: any) => {
      return { error: null };
    },

    updateUser: async ({ password }: { password: string }) => {
      try {
        await api.post("/auth/change-password", { newPassword: password });
        return { error: null };
      } catch (e: any) {
        return { error: { message: e.message } };
      }
    },
  },

  from: (table: string) => new QueryBuilder(table),

  rpc: async (fn: string, args: any) => {
    if (fn === "has_role") {
      try {
        const data: any = await api.get("/auth/me");
        const role = data?.user?.role;
        const hasRole = role === args._role || role === args.required_role;
        return { data: hasRole, error: null };
      } catch {
        return { data: false, error: null };
      }
    }
    return { data: null, error: { message: "Unknown RPC: " + fn } };
  },
};

class QueryBuilder {
  private _table: string;
  private _filters: Array<[string, any]> = [];
  private _order: { field: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _single = false;
  private _insertData: any = null;
  private _updateData: any = null;
  private _deleteMode = false;
  private _upsertData: any = null;
  private _upsertOpts: any = null;

  constructor(table: string) {
    this._table = table;
  }

  select(_fields = "*") { return this; }
  eq(field: string, value: any) { this._filters.push([field, value]); return this; }
  neq(field: string, value: any) { return this; }
  order(field: string, opts?: { ascending?: boolean }) {
    this._order = { field, ascending: opts?.ascending ?? true };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }
  insert(data: any) { this._insertData = data; return this; }
  update(data: any) { this._updateData = data; return this; }
  delete() { this._deleteMode = true; return this; }
  upsert(data: any, opts?: any) { this._upsertData = data; this._upsertOpts = opts; return this; }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      const tableMap: Record<string, string> = {
        campaigns: "/campaigns",
        donations: "/donations",
        settings: "/settings",
        audit_logs: "/audit-logs",
        profiles: "/users/profiles",
        user_roles: "/users/roles",
      };

      const endpoint = tableMap[this._table] || `/${this._table}`;

      if (this._insertData) {
        const data = await api.post(endpoint, this._insertData);
        return { data, error: null };
      }

      if (this._upsertData) {
        const key = this._upsertData.key;
        const data = await api.put(`/settings/${key}`, { value: this._upsertData.value, updated_at: this._upsertData.updated_at });
        return { data, error: null };
      }

      if (this._updateData) {
        const idFilter = this._filters.find(([f]) => f === "id");
        if (idFilter) {
          const data = await api.patch(`${endpoint}/${idFilter[1]}`, this._updateData);
          return { data, error: null };
        }
        return { data: null, error: { message: "No ID filter for update" } };
      }

      if (this._deleteMode) {
        const idFilter = this._filters.find(([f]) => f === "id");
        if (idFilter) {
          const data = await api.delete(`${endpoint}/${idFilter[1]}`);
          return { data, error: null };
        }
        return { data: null, error: { message: "No ID filter for delete" } };
      }

      const params = new URLSearchParams();
      this._filters.forEach(([field, value]) => {
        if (field !== "id") params.append(field, String(value));
      });
      if (this._order) params.append("_order", `${this._order.field}:${this._order.ascending ? "asc" : "desc"}`);
      if (this._limit) params.append("_limit", String(this._limit));

      const idFilter = this._filters.find(([f]) => f === "id");
      const url = idFilter ? `${endpoint}/${idFilter[1]}` : `${endpoint}?${params}`;
      const data = await api.get(url);

      if (this._single) {
        const result = Array.isArray(data) ? data[0] ?? null : data;
        return { data: result, error: null };
      }

      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  then(
    resolve: (value: { data: any; error: any }) => any,
    reject?: (reason: any) => any
  ) {
    return this.execute().then(resolve, reject);
  }
}
