import dotenv from "dotenv";

dotenv.config();

type EnvConfig = {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT || 3000),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY")
};
