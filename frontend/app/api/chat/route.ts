/**
 * Next.js API route that proxies chat requests to the backend streaming endpoint.
 * 
 * This route simplifies the frontend API by handling:
 * - Thread creation
 * - Provider routing
 * - Streaming proxy to backend
 * 
 * Endpoint: POST /api/chat
 * Payload: { messages: [{ role: 'user', content: string }] } or { prompt: string }
 * Headers: x-org-id (optional, defaults to 'org_demo')
 */
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const DEFAULT_ORG_ID = 'org_demo';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id') || DEFAULT_ORG_ID;

    // Extract message content
    let messageContent: string;
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      // Support OpenAI-style messages array
      messageContent = body.messages[body.messages.length - 1].content;
    } else if (body.prompt) {
      messageContent = body.prompt;
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing messages or prompt in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OPTIMIZATION: Skip router call - backend will route internally
    // This eliminates one round-trip and reduces latency

    // Step 1: Create thread if needed (only if thread_id not provided)
    // CRITICAL: Must have a valid thread_id before calling streaming endpoint
    let threadId = body.thread_id;
    if (!threadId) {
      // Create thread - this is REQUIRED for streaming endpoint
      try {
        const threadHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-org-id': orgId,
        };
        if (authHeader) {
          threadHeaders['Authorization'] = authHeader;
        }

        const threadResponse = await fetch(`${BACKEND_URL}/threads/`, {
          method: 'POST',
          headers: threadHeaders,
          body: JSON.stringify({
            title: messageContent.substring(0, 50),
            description: body.description || '',
          }),
        });

        if (threadResponse.ok) {
          const threadData = await threadResponse.json();
          threadId = threadData.thread_id || threadData.id;
        } else {
          const errorText = await threadResponse.text();
          console.error('[API /chat] Thread creation failed:', threadResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to create thread', details: errorText }),
            { status: threadResponse.status, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (e: any) {
        console.error('[API /chat] Thread creation error:', e);
        return new Response(
          JSON.stringify({ error: 'Failed to create thread', details: e.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate we have a thread_id before proceeding
    if (!threadId) {
      return new Response(
        JSON.stringify({ error: 'Missing thread_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Call backend streaming endpoint directly
    // Backend will handle routing internally (faster - no extra round-trip)
    const streamRequestBody: any = {
      content: messageContent,
      role: 'user',
      provider: 'openrouter',  // Use openrouter as placeholder, backend will route
      model: 'auto',           // Backend will choose model
      scope: 'private',
    };

    // Add attachments if provided
    if (body.attachments && Array.isArray(body.attachments) && body.attachments.length > 0) {
      streamRequestBody.attachments = body.attachments;
    }

    const streamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-org-id': orgId,
    };
    if (authHeader) {
      streamHeaders['Authorization'] = authHeader;
    }

    const streamResponse = await fetch(`${BACKEND_URL}/threads/${threadId}/messages/stream`, {
      method: 'POST',
      headers: streamHeaders,
      body: JSON.stringify(streamRequestBody),
    });

    // CRITICAL: Extract thread_id from response headers or URL
    // Backend should return thread_id in response headers for new threads
    const responseThreadId = streamResponse.headers.get('x-thread-id') ||
      streamResponse.headers.get('thread-id') ||
      threadId ||
      streamResponse.url.split('/threads/')[1]?.split('/')[0] ||
      null;

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error('[API /chat] Streaming failed:', streamResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start streaming', details: errorText }),
        { status: streamResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Proxy the SSE stream directly (backend handles router metadata)
    const stream = streamResponse.body;
    if (!stream) {
      return new Response(
        JSON.stringify({ error: 'No stream body' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return streaming response with proper headers (direct proxy - no transformation)
    // CRITICAL: Include thread_id in response headers so frontend can maintain conversation continuity
    const responseHeaders: HeadersInit = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    };

    // Add thread_id to response headers if we have it
    if (responseThreadId) {
      responseHeaders['x-thread-id'] = responseThreadId;
    }

    return new Response(stream, {
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
