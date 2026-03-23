import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { personStats, yearRecords, year, absenceType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeLabel = absenceType === "sick_leave" ? "ziekte" : "verlof";

    const dataDescription = personStats
      .filter((p: any) => p.count > 0)
      .map((p: any) => `- ${p.name}: ${p.count}x ${typeLabel}, ${p.days} dagen totaal`)
      .join("\n");

    const recordsDetail = yearRecords
      .map((r: any) => `- ${r.person_name}: ${r.start_date}${r.end_date ? ` t/m ${r.end_date}` : " (lopend)"}${r.notes ? ` (${r.notes})` : ""}`)
      .join("\n");

    const systemPrompt = `Je bent Linq, de vriendelijke mascotte van LinqBoard. Je schrijft in correct, vloeiend Nederlands zonder spelfouten of grammaticale fouten. Schrijf warm en menselijk, maar altijd grammaticaal correct. Gebruik maximaal 4-5 korte zinnen over de ${typeLabel}data. Vermijd opsommingen of bullet points. Focus op:
1. Wie valt op (meeste dagen/frequentie)?
2. Zijn er patronen? (bijv. elke maand, altijd op maandag/vrijdag, seizoensgebonden)
3. Een kort, bemoedigend advies of opmerking.
Controleer je tekst op correct gebruik van werkwoorden, vervoegingen en zinsconstructies. Schrijf "zien" nooit als werkwoord voor "we" — het is "zien we" is fout, "we zien" is fout, gebruik "we zien" NOOIT. De correcte vormen zijn: "we zien" → "we zien" moet ALTIJD "we zien" zijn… Nee: de stam van "zien" is "zie", dus: "ik zie", "we zien" is FOUT → "we zien" moet zijn "we zien"… 

BELANGRIJK: De correcte vervoeging is: ik zie, jij ziet, hij/zij ziet, wij zien, jullie zien, zij zien. Gebruik deze vervoegingen correct. Andere veelgemaakte fouten: "iedereen voelen" moet "iedereen voelt" zijn, "het valt op dat" is correct. Schrijf professioneel maar toegankelijk Nederlands.`;


    const userPrompt = `Analyseer de ${typeLabel}data voor het jaar ${year}:

Overzicht per persoon:
${dataDescription || "Geen registraties gevonden."}

Gedetailleerde registraties:
${recordsDetail || "Geen registraties."}

Geef je analyse.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Geen credits meer beschikbaar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Geen analyse beschikbaar.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-absence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
