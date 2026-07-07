import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: caller may pass provider_id to re-embed a specific listing.
    // When present, JWT auth + ownership verification are required.
    let targetProviderId: string | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.provider_id) {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: owned } = await supabase
          .from("providers")
          .select("id")
          .eq("id", body.provider_id)
          .eq("owner_id", user.id)
          .maybeSingle();
        if (!owned) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetProviderId = body.provider_id as string;
      }
    }

    let query = supabase.from("providers").select("id, name, category, description");
    if (targetProviderId) {
      query = query.eq("id", targetProviderId);
    } else {
      query = query.is("embedding", null);
    }

    const { data: providers, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!providers || providers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No providers need embedding." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = new Supabase.ai.Session("gte-small");
    let updated = 0;

    for (const provider of providers) {
      const text = `${provider.name} — ${provider.category}. ${provider.description}`;
      const embedding = await session.run(text, { mean_pool: true, normalize: true });

      const { error: updateError } = await supabase
        .from("providers")
        .update({ embedding })
        .eq("id", provider.id);

      if (updateError) {
        console.error(`Failed to update ${provider.id}:`, updateError);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Embedded ${updated} providers.`, total: providers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
