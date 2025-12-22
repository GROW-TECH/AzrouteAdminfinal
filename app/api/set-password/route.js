// app/api/set-password/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

// admin client (server only)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, newPassword } = body || {};

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword required' }, { status: 400 });
    }

    // Update the Auth password (use admin method)
    // SDK versions differ: try admin.updateUserById first, otherwise admin.updateUser
    let updateResult;
    if (typeof supabaseAdmin.auth.admin.updateUserById === 'function') {
      updateResult = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword, email_confirm: true });
    } else {
      // fallback: admin.updateUser
      updateResult = await supabaseAdmin.auth.admin.updateUser({ id: userId, password: newPassword, email_confirm: true });
    }

    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 400 });
    }

    // Also write plain text password into profiles table (optional - insecure)
    const { error: pErr } = await supabaseAdmin
      .from('profiles')
      .upsert([{ id: userId, password: newPassword }], { onConflict: 'id' });

    if (pErr) {
      return NextResponse.json({ error: 'Auth updated but profiles upsert failed: ' + pErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('set-password error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
