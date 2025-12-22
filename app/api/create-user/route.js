// app/api/create-user/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// IMPORTANT: use the server-side env vars (do NOT use NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Throw at import-time to make the error obvious during dev.
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, username, branch_name } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    // create user with admin API; email_confirm: true will skip confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, branch_name }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // SDK might return user under data.user or data depending on version
    const user = data?.user ?? data;
    if (!user?.id) {
      return NextResponse.json({ error: 'No user id returned from admin.createUser' }, { status: 500 });
    }

    return NextResponse.json({ id: user.id }, { status: 200 });
  } catch (err) {
    console.error('create-user error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
