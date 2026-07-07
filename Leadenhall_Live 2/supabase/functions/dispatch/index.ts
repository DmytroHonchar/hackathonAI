import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Kept short intentionally — every token here is paid per API call
const SYSTEM_PROMPT = `You are Dispatch, a concierge for home services (plumbers, electricians, cleaners). You serve any location — use the provider's city and distance to give accurate location info. Rules: (1) Always call search_providers first — never invent providers. (2) Show 2–3 options max with a one-line reason each. (3) Before create_booking you need a time, address, and confirmed provider — ask for one missing item at a time. (4) After booking, confirm details and mention the Bookings page. (5) Reply in the user's language. (6) If no results, say so and offer to widen filters. (7) Never assume or state a provider is in a specific city unless their data explicitly says so. Be concise.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_providers",
      description: "Search home-service providers. Call before recommending anyone.",
      parameters: {
        type: "object",
        properties: {
          natural_query: { type: "string" },
          category: { type: "string", enum: ["plumber", "electrician", "cleaner"] },
          max_price: { type: "number" },
          emergency: { type: "boolean" },
        },
        required: ["natural_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_provider",
      description: "Get details for a specific provider by ID.",
      parameters: {
        type: "object",
        properties: { provider_id: { type: "string" } },
        required: ["provider_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a booking. Needs confirmed provider, ISO datetime, and address.",
      parameters: {
        type: "object",
        properties: {
          provider_id: { type: "string" },
          scheduled_for: { type: "string" },
          address: { type: "string" },
          notes: { type: "string" },
        },
        required: ["provider_id", "scheduled_for", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booking_status",
      description: "Get the status of a booking.",
      parameters: {
        type: "object",
        properties: { booking_id: { type: "string" } },
        required: ["booking_id"],
      },
    },
  },
];

// Fields surfaced to the UI (full display data)
interface ProviderResult {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  price_from: number;
  rating: number;
  review_count: number;
  distance_km: number;
  lat: number;
  lng: number;
  photo_url: string;
  languages: string[];
  emergency: boolean;
}

interface UiState {
  providers?: ProviderResult[];
  booking?: {
    id: string;
    provider_name: string;
    scheduled_for: string;
    address: string;
    price: number;
    status: string;
  };
  status?: {
    booking_id: string;
    status: string;
  };
}

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

// Compact provider shape sent to the model — no embedding, no photo, no coords
function toModelProvider(p: ProviderResult & { score?: number; city?: string }) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    city: p.city ?? "Unknown",
    desc: (p.description ?? "").slice(0, 120),
    price: p.price_from,
    rating: p.rating,
    reviews: p.review_count,
    dist_km: Math.round(p.distance_km * 10) / 10,
    emergency: p.emergency,
    languages: p.languages,
  };
}

// Groq API call with retry on 429
async function callGroq(
  messages: GroqMessage[],
  attempt = 0
): Promise<{ ok: boolean; status: number; body: unknown; retries: number }> {
  const start = Date.now();
  // openai/gpt-oss-120b: 250K TPM (vs 8K for qwen/qwen3.6-27b), no thinking tokens, reliable tool use
  const MODEL = "openai/gpt-oss-120b";

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      tools: TOOLS,
      tool_choice: "auto",
      messages,
    }),
  });

  const duration = Date.now() - start;

  if (resp.status === 429 && attempt < 2) {
    const retryAfterSec = parseInt(resp.headers.get("retry-after") ?? "12", 10);
    const waitMs = Math.min(retryAfterSec * 1000, 20_000);
    console.log(`[dispatch] 429 on attempt ${attempt + 1}, waiting ${waitMs}ms (retry-after: ${retryAfterSec}s)`);
    await new Promise((r) => setTimeout(r, waitMs));
    return callGroq(messages, attempt + 1);
  }

  const body = await resp.json();
  const usage = (body as { usage?: { prompt_tokens: number; completion_tokens: number } }).usage;
  console.log(
    `[dispatch] model=${MODEL} attempt=${attempt + 1} status=${resp.status} ` +
    `prompt_tokens=${usage?.prompt_tokens ?? "?"} completion_tokens=${usage?.completion_tokens ?? "?"} ` +
    `duration=${duration}ms`
  );

  return { ok: resp.ok, status: resp.status, body, retries: attempt };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, user_location, session_id } = await req.json();
    const userLat = user_location?.lat ?? 51.5074;
    const userLng = user_location?.lng ?? -0.1278;

    const ui: UiState = {};
    const session = new Supabase.ai.Session("gte-small");

    async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
      if (name === "search_providers") {
        const { natural_query, category, max_price, emergency } = input as {
          natural_query: string;
          category?: string;
          max_price?: number;
          emergency?: boolean;
        };

        const embedding = await session.run(natural_query, { mean_pool: true, normalize: true });

        const { data: semanticData, error: semanticError } = await supabaseService.rpc("match_providers", {
          query_embedding: embedding,
          match_count: 10,
          filter_category: category ?? null,
          user_lat: userLat,
          user_lng: userLng,
        });

        if (semanticError) throw new Error(`match_providers failed: ${semanticError.message}`);

        let results = semanticData ?? [];
        if (results.length === 0) {
          const { data: fallback } = await supabaseService.rpc("search_providers", {
            filter_category: category ?? null,
            max_price: null,
            only_emergency: emergency ?? false,
            user_lat: userLat,
            user_lng: userLng,
            max_distance_km: 500,
          });
          results = fallback ?? [];
        }

        if (max_price != null) results = results.filter((p: { price_from: number }) => p.price_from <= max_price);
        if (emergency) results = results.filter((p: { emergency: boolean }) => p.emergency);
        const top5 = results.slice(0, 5);

        // Full data for the UI panel (photo, coords, etc.)
        ui.providers = top5.map((p: ProviderResult & { score?: number }) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          city: p.city,
          price_from: p.price_from,
          rating: p.rating,
          review_count: p.review_count,
          distance_km: Math.round(p.distance_km * 10) / 10,
          lat: p.lat,
          lng: p.lng,
          photo_url: p.photo_url,
          languages: p.languages,
          emergency: p.emergency,
        }));

        // Compact version for the model — strips embedding, photo, coords, truncates desc
        return top5.map(toModelProvider);
      }

      if (name === "get_provider") {
        const { provider_id } = input as { provider_id: string };
        // Explicit column list — NEVER select * (would include embedding vector)
        const { data, error } = await supabaseService
          .from("providers")
          .select("id, name, category, description, city, lat, lng, price_from, rating, review_count, emergency, languages")
          .eq("id", provider_id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        return { ...data, description: (data.description ?? "").slice(0, 200) };
      }

      if (name === "create_booking") {
        const { provider_id, scheduled_for, address, notes } = input as {
          provider_id: string;
          scheduled_for: string;
          address: string;
          notes?: string;
        };

        const { data: provider, error: pErr } = await supabaseService
          .from("providers")
          .select("name, price_from")
          .eq("id", provider_id)
          .maybeSingle();
        if (pErr || !provider) throw new Error("Provider not found");

        const { data: booking, error: bErr } = await supabaseUser
          .from("bookings")
          .insert({ provider_id, scheduled_for, address, notes: notes ?? null, price: provider.price_from, status: "pending" })
          .select("id, status, scheduled_for, address, price")
          .single();
        if (bErr) throw new Error(bErr.message);

        ui.booking = {
          id: booking.id,
          provider_name: provider.name,
          scheduled_for: booking.scheduled_for,
          address: booking.address,
          price: booking.price,
          status: booking.status,
        };
        return ui.booking;
      }

      if (name === "get_booking_status") {
        const { booking_id } = input as { booking_id: string };
        const { data, error } = await supabaseUser
          .from("bookings")
          .select("id, status, scheduled_for, provider_id")
          .eq("id", booking_id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error("Booking not found");

        const { data: prov } = await supabaseService
          .from("providers")
          .select("name")
          .eq("id", data.provider_id)
          .maybeSingle();

        ui.status = { booking_id: data.id, status: data.status };
        return { booking_id: data.id, status: data.status, scheduled_for: data.scheduled_for, provider_name: prov?.name ?? "Unknown" };
      }

      throw new Error(`Unknown tool: ${name}`);
    }

    // Limit history to last 6 messages to cap input tokens
    const recentMessages = (messages as Array<{ role: string; content: string }>).slice(-6);

    const groqMessages: GroqMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let finalReply = "";
    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const { ok, status, body, retries } = await callGroq(groqMessages);

      if (!ok) {
        if (status === 429) {
          finalReply = "The AI assistant is temporarily busy — please try again in a moment.";
          break;
        }
        const errMsg = (body as { error?: { message?: string } }).error?.message ?? JSON.stringify(body);
        throw new Error(`Groq API error ${status}: ${errMsg}`);
      }

      if (retries > 0) {
        console.log(`[dispatch] succeeded after ${retries} retry(s)`);
      }

      const result = body as {
        choices?: Array<{
          finish_reason: string;
          message: {
            content: string | null;
            tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
          };
        }>;
      };

      const choice = result.choices?.[0];
      if (!choice) throw new Error("Empty response from Groq");

      const assistantMsg = choice.message;

      if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
        groqMessages.push({
          role: "assistant",
          content: assistantMsg.content ?? null,
          tool_calls: assistantMsg.tool_calls as GroqMessage["tool_calls"],
        });

        for (const tc of assistantMsg.tool_calls) {
          let toolOutput: unknown;
          try {
            const input = JSON.parse(tc.function.arguments);
            toolOutput = await executeTool(tc.function.name, input);
          } catch (err) {
            toolOutput = { error: (err as Error).message };
          }
          groqMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(toolOutput),
          });
        }
      } else {
        finalReply = (assistantMsg.content ?? "").trim();
        if (!finalReply) finalReply = "I found some results — please let me know if you'd like to book.";
        break;
      }

      if (i === MAX_ITERATIONS - 1) {
        finalReply = "I've gathered information but hit a processing limit. Here's what I found.";
      }
    }

    // Persist conversation
    const lastUserMessage = recentMessages.findLast((m) => m.role === "user");
    if (lastUserMessage) {
      await supabaseUser.from("conversations").insert([
        { user_id: user.id, role: "user", content: lastUserMessage.content, session_id: session_id ?? null },
        { user_id: user.id, role: "assistant", content: finalReply, session_id: session_id ?? null },
      ]);
      if (session_id) {
        await supabaseUser
          .from("chat_sessions")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", session_id);
      }
    }

    return new Response(
      JSON.stringify({ reply: finalReply, ui }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dispatch] unhandled error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
