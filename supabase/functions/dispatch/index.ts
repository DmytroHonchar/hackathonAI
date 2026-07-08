import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Dispatch, a concierge for home services (plumbers, electricians, cleaners). You serve any location — use the provider's city and distance to give accurate location info. Rules: (1) Always call search_providers first — never invent providers. (2) Show 2–3 options max with a one-line reason each. (3) Before create_booking you need a time, address, and confirmed provider — ask for one missing item at a time. (4) After booking, confirm details and mention the Bookings page. (5) Reply in the user's language. (6) If no results, say so and offer to widen filters. (7) Never assume or state a provider is in a specific city unless their data explicitly says so. Be concise. Do not output raw JSON or code blocks in your replies.`;

const TOOL_CALL_REMINDER = "IMPORTANT: When invoking a tool, the arguments field must contain only a valid JSON object with no extra text or fields beyond those defined in the tool schema.";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_providers",
      description: "Search home-service providers. Call before recommending anyone.",
      parameters: {
        type: "object",
        properties: {
          natural_query: { type: "string", description: "Plain-text description of what the user needs" },
          category: { type: "string", description: "Service category: plumber, electrician, or cleaner" },
          max_price: { type: "number", description: "Maximum hourly price the user is willing to pay" },
          emergency: { type: "boolean", description: "Set true only if the user explicitly needs emergency service" },
        },
        required: ["natural_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_provider",
      description: "Get full details for a specific provider by ID.",
      parameters: {
        type: "object",
        properties: {
          provider_id: { type: "string", description: "UUID of the provider" },
        },
        required: ["provider_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a booking. Requires a confirmed provider, an ISO-8601 datetime, and a service address.",
      parameters: {
        type: "object",
        properties: {
          provider_id: { type: "string", description: "UUID of the chosen provider" },
          scheduled_for: { type: "string", description: "ISO-8601 datetime string" },
          address: { type: "string", description: "Full service address" },
          notes: { type: "string", description: "Optional additional notes for the provider" },
        },
        required: ["provider_id", "scheduled_for", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booking_status",
      description: "Get the current status of an existing booking.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "UUID of the booking" },
        },
        required: ["booking_id"],
      },
    },
  },
];

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

async function callGroq(
  messages: GroqMessage[],
  opts: { attempt?: number; extraSystemNote?: string } = {}
): Promise<{ ok: boolean; status: number; body: unknown; retries: number }> {
  const { attempt = 0, extraSystemNote } = opts;
  const start = Date.now();

  const finalMessages = extraSystemNote
    ? messages.map((m, i) =>
        i === 0 ? { ...m, content: (m.content ?? "") + "\n\n" + extraSystemNote } : m
      )
    : messages;

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.2,
      tools: TOOLS,
      tool_choice: "auto",
      messages: finalMessages,
    }),
  });

  const duration = Date.now() - start;
  const body = await resp.json();

  const usage = (body as { usage?: { prompt_tokens: number; completion_tokens: number } }).usage;
  console.log(
    `[dispatch] model=${MODEL} attempt=${attempt + 1} status=${resp.status} ` +
    `prompt_tokens=${usage?.prompt_tokens ?? "?"} completion_tokens=${usage?.completion_tokens ?? "?"} ` +
    `duration=${duration}ms`
  );

  if (!resp.ok) {
    // Log the full error body so failed_generation is visible in edge function logs
    console.error(`[dispatch] Groq error ${resp.status} full body:`, JSON.stringify(body));
    const fg = (body as { error?: { failed_generation?: string } }).error?.failed_generation;
    if (fg) console.error("[dispatch] failed_generation:", fg);
  }

  if (resp.status === 429 && attempt < 2) {
    const retryAfterSec = parseInt(resp.headers.get("retry-after") ?? "12", 10);
    const waitMs = Math.min(retryAfterSec * 1000, 20_000);
    console.log(`[dispatch] 429 on attempt ${attempt + 1}, waiting ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
    return callGroq(messages, { attempt: attempt + 1, extraSystemNote });
  }

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

        // Normalise category in case the model uses wrong casing
        const normCategory = typeof category === "string"
          ? category.toLowerCase().trim()
          : undefined;
        const validCategories = ["plumber", "electrician", "cleaner"];
        const safeCategory = normCategory && validCategories.includes(normCategory)
          ? normCategory
          : null;

        const embedding = await session.run(natural_query, { mean_pool: true, normalize: true });

        const { data: semanticData, error: semanticError } = await supabaseService.rpc("match_providers", {
          query_embedding: embedding,
          match_count: 10,
          filter_category: safeCategory,
          user_lat: userLat,
          user_lng: userLng,
        });

        if (semanticError) throw new Error(`match_providers failed: ${semanticError.message}`);

        let results = semanticData ?? [];
        if (results.length === 0) {
          const { data: fallback, error: fallbackError } = await supabaseService.rpc("search_providers", {
            filter_category: safeCategory,
            max_price: null,
            only_emergency: emergency ?? false,
            user_lat: userLat,
            user_lng: userLng,
            max_distance_km: 500,
          });
          if (fallbackError) console.error("[dispatch] search_providers fallback error:", fallbackError.message);
          results = fallback ?? [];
        }

        if (max_price != null) results = results.filter((p: { price_from: number }) => p.price_from <= max_price);
        if (emergency) results = results.filter((p: { emergency: boolean }) => p.emergency);
        const top5 = results.slice(0, 5);

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

        return top5.map(toModelProvider);
      }

      if (name === "get_provider") {
        const { provider_id } = input as { provider_id: string };
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
      let { ok, status, body, retries } = await callGroq(groqMessages);

      // On 400 failed_generation, retry once with an explicit reminder
      if (!ok && status === 400) {
        const errBody = body as { error?: { message?: string; failed_generation?: string } };
        const isToolCallFailure = errBody.error?.message?.includes("Failed to call a function") ||
                                   errBody.error?.failed_generation !== undefined;

        if (isToolCallFailure) {
          console.warn("[dispatch] tool call failure — retrying with reminder");
          const retry = await callGroq(groqMessages, { extraSystemNote: TOOL_CALL_REMINDER });
          ok = retry.ok;
          status = retry.status;
          body = retry.body;
          retries = retry.retries;
        }
      }

      if (!ok) {
        if (status === 429) {
          finalReply = "The AI assistant is temporarily busy — please try again in a moment.";
        } else {
          console.error(`[dispatch] unrecoverable Groq error ${status}`);
          finalReply = "I'm having trouble connecting right now. Please try again in a moment.";
        }
        break;
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
      if (!choice) {
        finalReply = "I received an unexpected response. Please try again.";
        break;
      }

      const assistantMsg = choice.message;

      if (assistantMsg.tool_calls?.length) {
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
            console.error(`[dispatch] tool ${tc.function.name} error:`, (err as Error).message);
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
