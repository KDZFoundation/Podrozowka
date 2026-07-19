// This file is automatically configured for multiple environments.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded configurations for Dev and UAT (from Lovable)
const CONFIGS = {
  dev: {
    url: "https://uacuxblipehehknafwep.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY3V4YmxpcGVoZWhrbmFmd2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODg0OTcsImV4cCI6MjA4NDU2NDQ5N30.ZuDM-o1sLkwst19ABElz_-OE87ANKkOew47n_aaBVZE",
  },
  uat: {
    url: "https://bpxxycpeyocrwpaxnfvh.supabase.co",
    anonKey: "sb_publishable_x5gAImjDFNUSDKI0Y8TWAA_4RYFc7yg",
  },
  prod: {
    // Falls back to build-time environment variables, or your custom values
    url: import.meta.env.VITE_SUPABASE_URL_PROD || "https://your_production_supabase_project_id.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY_PROD || "",
  }
};

// Start by reading the Vite build-time environment variables
let activeUrl = import.meta.env.VITE_SUPABASE_URL;
let activeKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let currentEnv = import.meta.env.VITE_APP_ENV || "development";

// Runtime Domain/URL Detection Fallbacks
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  
  if (hostname === "podrozowka.pl" || hostname === "www.podrozowka.pl" || currentEnv === "production" || currentEnv === "prod") {
    currentEnv = "production";
    // Prefer explicitly set build-time environment variables, otherwise fall back to production config
    activeUrl = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("uacuxblipehehknafwep") && !import.meta.env.VITE_SUPABASE_URL.includes("bpxxycpeyocrwpaxnfvh")
      ? import.meta.env.VITE_SUPABASE_URL
      : CONFIGS.prod.url;
    activeKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && !import.meta.env.VITE_SUPABASE_URL.includes("uacuxblipehehknafwep") && !import.meta.env.VITE_SUPABASE_URL.includes("bpxxycpeyocrwpaxnfvh")
      ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      : CONFIGS.prod.anonKey;
  } else if (hostname.includes("uat") || currentEnv === "uat") {
    currentEnv = "uat";
    activeUrl = CONFIGS.uat.url;
    activeKey = CONFIGS.uat.anonKey;
  } else {
    // In any other case (including local development / AI Studio preview), use Lovable Dev as development database
    currentEnv = "development";
    activeUrl = CONFIGS.dev.url;
    activeKey = CONFIGS.dev.anonKey;
  }
}

console.log(`[Supabase Client] Connected to environment: ${currentEnv.toUpperCase()}`);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(activeUrl, activeKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});