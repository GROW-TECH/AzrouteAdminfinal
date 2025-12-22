// /app/api/create-meet/route.js

import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabaseClient'; 
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
);

export async function POST(req) {
    const classData = await req.json();
    
    // 1. Verify user session using the token from the request header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized: No session token provided.' }, { status: 401 });
    }
    
    const { data: { user }, error: userFetchError } = await supabaseAdmin.auth.getUser(token);
    
    if (userFetchError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid session token.' }, { status: 401 });
    }

    const user_id = user.id;

    // 2. Fetch the stored Google tokens for the logged-in user
    const { data: integration, error: fetchError } = await supabaseAdmin
        .from('google_integrations')
        .select('*')
        .eq('user_id', user_id)
        .single();

    if (fetchError || !integration) {
        return NextResponse.json({ error: 'Google account not connected or tokens not found. Please connect your Google account.' }, { status: 403 });
    }

    try {
        // 3. Set and Refresh the Google credentials
        oauth2Client.setCredentials({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
            expiry_date: new Date(integration.token_expiry).getTime(), 
        });

        // Manually trigger token refresh check and update DB if needed
        if (oauth2Client.isTokenExpiring() || new Date() > new Date(integration.token_expiry)) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            
            await supabaseAdmin
                .from('google_integrations')
                .update({
                    access_token: credentials.access_token,
                    token_expiry: new Date(credentials.expiry_date).toISOString(),
                    // Do not overwrite refresh_token unless a new one is explicitly returned
                    refresh_token: credentials.refresh_token || integration.refresh_token, 
                })
                .eq('user_id', user_id);
        }

        // 4. Create the Calendar event
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Format date and time for ISO string
        const eventStart = new Date(`${classData.date}T${classData.time}:00`);
        const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1-hour class

        const event = {
            summary: `${classData.class_name} with ${classData.coach}`,
            description: `Level: ${classData.level}, Status: ${classData.status}`,
            start: { dateTime: eventStart.toISOString(), timeZone: 'Asia/Kolkata' }, // Set your local timezone
            end: { dateTime: eventEnd.toISOString(), timeZone: 'Asia/Kolkata' },
            conferenceData: {
                createRequest: { requestId: `${Date.now()}` }, // Essential for Meet link
            },
            attendees: [{ email: integration.email }], 
        };

        const response = await calendar.events.insert({
            calendarId: 'primary', 
            resource: event,
            conferenceDataVersion: 1, // Must be 1
        });

        const meetLink = response.data.hangoutLink;
        
        // 5. Save the new class with the Meet link
        const { data, error: classSaveError } = await supabaseAdmin
            .from('classlist')
            .insert([{ ...classData, meet_link: meetLink }]) 
            .select()
            .single();

        if (classSaveError) {
            console.error('Failed to save class with meet link:', classSaveError);
            return NextResponse.json({ error: 'Class saved, but failed to save meet link to DB.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, meetLink: meetLink, classId: data.id });

    } catch (error) {
        console.error('Google API or Token Error:', error.message);
        return NextResponse.json({ error: 'Failed to create Google Meet/Calendar event. Ensure your Google account is properly connected.' }, { status: 500 });
    }
}