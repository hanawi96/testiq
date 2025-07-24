import type { APIRoute } from 'astro';
import { supabase } from '../../../backend/config/supabase';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 Testing RPC function...');
    
    // Test RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_with_profiles', {
      page_limit: 5,
      page_offset: 0
    });
    
    console.log('🔍 RPC Result:', rpcData);
    console.log('🔍 RPC Error:', rpcError);
    
    // Test direct query
    const { data: directData, error: directError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, username')
      .limit(5);
    
    console.log('🔍 Direct Query Result:', directData);
    console.log('🔍 Direct Query Error:', directError);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Debug Users</title>
          <style>
              body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
              .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
              .success { background: #d4edda; border-color: #c3e6cb; }
              .error { background: #f8d7da; border-color: #f5c6cb; }
              pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f8f9fa; }
          </style>
      </head>
      <body>
          <h1>🔍 Debug Users Data</h1>
          
          <div class="section ${rpcError ? 'error' : 'success'}">
              <h2>RPC Function Result</h2>
              ${rpcError ? `<p><strong>Error:</strong> ${rpcError.message}</p>` : ''}
              <pre>${JSON.stringify(rpcData, null, 2)}</pre>
              
              ${rpcData && rpcData.length > 0 ? `
                  <h3>RPC Data Table:</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Email</th>
                              <th>Full Name</th>
                              <th>Username</th>
                              <th>Role</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${rpcData.map((user: any) => `
                              <tr>
                                  <td>${user.email || 'N/A'}</td>
                                  <td>${user.full_name || 'N/A'}</td>
                                  <td><strong>${user.username || 'NULL'}</strong></td>
                                  <td>${user.role || 'N/A'}</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              ` : ''}
          </div>
          
          <div class="section ${directError ? 'error' : 'success'}">
              <h2>Direct Query Result</h2>
              ${directError ? `<p><strong>Error:</strong> ${directError.message}</p>` : ''}
              <pre>${JSON.stringify(directData, null, 2)}</pre>
              
              ${directData && directData.length > 0 ? `
                  <h3>Direct Query Table:</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Email</th>
                              <th>Full Name</th>
                              <th>Username</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${directData.map((user: any) => `
                              <tr>
                                  <td>${user.email || 'N/A'}</td>
                                  <td>${user.full_name || 'N/A'}</td>
                                  <td><strong>${user.username || 'NULL'}</strong></td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              ` : ''}
          </div>
          
          <div class="section">
              <h2>🎯 Analysis</h2>
              <ul>
                  <li><strong>RPC Function Status:</strong> ${rpcError ? '❌ Failed' : '✅ Success'}</li>
                  <li><strong>Direct Query Status:</strong> ${directError ? '❌ Failed' : '✅ Success'}</li>
                  <li><strong>RPC Returns Username:</strong> ${rpcData && rpcData.length > 0 && rpcData[0].hasOwnProperty('username') ? '✅ Yes' : '❌ No'}</li>
                  <li><strong>Direct Query Has Username:</strong> ${directData && directData.length > 0 && directData.some((u: any) => u.username) ? '✅ Yes' : '❌ No'}</li>
              </ul>
          </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
