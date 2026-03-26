export async function onRequestPost(context) {
  try {
    // Try multiple ways to access the API key
    const apiKey = context.env.ANTHROPIC_API_KEY 
                || context.env['ANTHROPIC_API_KEY']
                || (typeof ANTHROPIC_API_KEY !== 'undefined' ? ANTHROPIC_API_KEY : null);

    if (!apiKey) {
      // Return debug info about what env vars are available
      const envKeys = context.env ? Object.keys(context.env) : [];
      return new Response(JSON.stringify({ 
        error: 'API key not configured',
        debug: 'Available env keys: ' + (envKeys.length ? envKeys.join(', ') : 'none'),
        hasEnv: !!context.env
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const body = await context.request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
