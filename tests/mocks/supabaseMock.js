export function createClient() {
  if (globalThis.__mockSupabase) {
    return globalThis.__mockSupabase;
  }

  return {
    auth: {
      getUser: async () => ({
        data: {
          user: null,
        },
        error: null,
      }),

      signOut: async () => ({
        error: null,
      }),
    },

    storage: {
      from() {
        return {
          upload: async () => ({
            error: null,
          }),

          getPublicUrl: () => ({
            data: {
              publicUrl: "https://example.com/image.png",
            },
          }),
        };
      },
    },

    from() {
      return {
        select() {
          return this;
        },

        eq() {
          return this;
        },

        in() {
          return this;
        },

        order() {
          return Promise.resolve({
            data: [],
            error: null,
          });
        },

        single() {
          return Promise.resolve({
            data: null,
            error: null,
          });
        },

        maybeSingle() {
          return Promise.resolve({
            data: null,
            error: null,
          });
        },

        update() {
          return this;
        },

        insert() {
          return Promise.resolve({
            data: null,
            error: null,
          });
        },

        delete() {
          return this;
        },
      };
    },
  };
}