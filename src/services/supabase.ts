import { createClient, type RealtimeClientOptions } from '@supabase/supabase-js';
import WebSocket from 'ws';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.warn('Missing EXPO_PUBLIC_SUPABASE_URL or Supabase public key. Add them to .env.');
}

const realtime: RealtimeClientOptions | undefined = typeof globalThis.WebSocket === 'undefined'
    ? { transport: WebSocket as unknown as RealtimeClientOptions['transport'] }
    : undefined;

export const supabase = createClient(
    url ?? 'https://missing.supabase.co',
    key ?? 'missing-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
        realtime,
    },
);