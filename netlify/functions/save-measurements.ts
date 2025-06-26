import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { measurements, rawLandmarks, profileData } = JSON.parse(event.body || '{}');

    if (!measurements || !rawLandmarks) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required data' }),
      };
    }

    // Get or create user profile
    let profileId: string;
    
    if (profileData?.id) {
      // Use existing profile
      profileId = profileData.id;
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          name: profileData?.name || 'Anonymous User',
          email: profileData?.email,
          preferences: profileData?.preferences || { units: 'inches', fit: 'regular' }
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create profile' }),
        };
      }

      profileId = newProfile.id;
    }

    // Save measurements
    const { data: savedMeasurement, error: measurementError } = await supabase
      .from('measurements')
      .insert({
        profile_id: profileId,
        measurements,
        raw_landmarks: rawLandmarks,
        confidence: measurements.confidence || 0.75
      })
      .select()
      .single();

    if (measurementError) {
      console.error('Measurement save error:', measurementError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save measurements' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        measurementId: savedMeasurement.id,
        profileId
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};