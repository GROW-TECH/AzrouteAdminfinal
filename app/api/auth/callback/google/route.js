// /app/api/auth/callback/google/route.js

import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
);

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const authUrlOnly = url.searchParams.get('auth_url_only');
  const userIdFromState = url.searchParams.get('state') || url.searchParams.get('user_id'); 

  if (code) {
    try {
      // 1. Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      const { access_token, refresh_token, expiry_date } = tokens;
      oauth2Client.setCredentials(tokens);

      // 2. Get Google profile (optional, just for storing email)
      const userinfo = google.oauth2({ version: 'v2', auth: oauth2Client });
      const googleUser = await userinfo.userinfo.get();
      const email = googleUser.data.email;

      // 3. Preserve old refresh_token if Google didn’t return a new one
      let finalRefreshToken = refresh_token;
      if (!refresh_token) {
        const { data: existing } = await supabaseAdmin
          .from('google_integrations')
          .select('refresh_token')
          .eq('user_id', userIdFromState)
          .maybeSingle();
        finalRefreshToken = existing?.refresh_token || null;
      }

      // 4. Upsert tokens into Supabase
      const { error: saveError } = await supabaseAdmin
        .from('google_integrations')
        .upsert({
          user_id: userIdFromState,
          email,
          access_token,
          refresh_token: finalRefreshToken,
          token_expiry: new Date(expiry_date).toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (saveError) {
        console.error('Error saving tokens:', saveError);
        return NextResponse.redirect(new URL('/class-list?error=save_token_failed', url.origin));
      }

      // 5. Redirect back to your app
      return NextResponse.redirect(new URL('/class-list?google_connected=true', url.origin));

    } catch (error) {
      console.error('Authentication failed:', error);
      return NextResponse.redirect(new URL('/class-list?error=auth_failed', url.origin));
    }
  }

  // --- Part 1: Generate Google Consent URL ---
  else if (authUrlOnly) {
    const userId = url.searchParams.get('user_id');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'email'],
      prompt: 'consent',
      state: userId, // 👈 Pass Supabase user_id here
    });
    return NextResponse.json({ authUrl });
  }
}
