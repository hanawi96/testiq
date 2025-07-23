import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/config/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { username } = await request.json();
    
    // Get first user and set username
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, username')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'No users found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Update username
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ username: username })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: updateData,
      message: `Username set to ${username}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
