import { z } from "zod";

const envSchema = z.object({
  RADARR_URL: z.string().url(),
  SONARR_URL: z.string().url(),
  PROWLARR_URL: z.string().url(),
  BAZARR_URL: z.string().url(),
  JELLYSEERR_URL: z.string().url(),
  RADARR_API_KEY: z.string().min(1),
  SONARR_API_KEY: z.string().min(1),
  PROWLARR_API_KEY: z.string().min(1),
  BAZARR_API_KEY: z.string().min(1),
  JELLYSEERR_API_KEY: z.string().min(1),

  ARR_BASIC_USER: z.string().optional().default(""),
  ARR_BASIC_PASS: z.string().optional().default(""),

  BASIC_USER_RADARR: z.string().optional().default(""),
  BASIC_USER_SONARR: z.string().optional().default(""),
  BASIC_USER_PROWLARR: z.string().optional().default(""),
  BASIC_USER_BAZARR: z.string().optional().default(""),
  BASIC_USER_JELLYSEERR: z.string().optional().default(""),
  BASIC_PASS_RADARR: z.string().optional().default(""),
  BASIC_PASS_SONARR: z.string().optional().default(""),
  BASIC_PASS_PROWLARR: z.string().optional().default(""),
  BASIC_PASS_BAZARR: z.string().optional().default(""),
  BASIC_PASS_JELLYSEERR: z.string().optional().default(""),

  JELLYFIN_URL: z.string().optional(),
  JELLYFIN_API_KEY: z.string().optional(),

  USE_MOCK_DATA: z.enum(["true", "false"]).optional().default("false"),
});

const result = envSchema.safeParse(process.env);

function fallbackEnv(): z.infer<typeof envSchema> {
  return new Proxy({} as z.infer<typeof envSchema>, {
    get(_, key: string) {
      const fromProcess = process.env[key];
      if (fromProcess !== undefined) return fromProcess;
      if (key === "USE_MOCK_DATA") return "false";
      if (key === "ARR_BASIC_USER" || key === "ARR_BASIC_PASS") return "";
      return fromProcess;
    },
  });
}

let _env: z.infer<typeof envSchema>;

if (result.success) {
  _env = result.data;
} else {
  if (process.env.NODE_ENV === "production" && !process.env.VITEST) {
    console.error("[env] Missing/invalid env vars:", Object.keys(result.error.flatten().fieldErrors).join(", "));
    console.error("[env] Using process.env fallback — some features may not work.");
  }
  _env = fallbackEnv();
}

export const env = _env;
