const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = {
  from: (table: string) => ({
    // GET all rows
    select: async (filter?: Record<string, any>) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
      if (filter) {
        Object.entries(filter).forEach(([k, v]) => {
          url += `&${k}=eq.${v}`;
        });
      }
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return res.json();
    },

    // INSERT a row
    insert: async (data: Record<string, any>) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      });
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    // UPDATE a row by id
    update: async (id: any, data: Record<string, any>) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      });
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    },

    // DELETE a row by id
    delete: async (id: any) => {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return { success: true };
    },
  }),
};
