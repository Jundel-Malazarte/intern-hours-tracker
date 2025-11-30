// route.ts : on src/app/api/entries/route.ts
import { NextRequest } from "next/server";
import {
  createEntries,
  getEntriesByUser,
} from "../../modules/entries/repository";
import { Entries } from "../../../../generated/prisma";
import { entriesSchema } from "@/app/modules/entries";
import { ZodError } from "zod";
import { createClient } from "@/utils/supabase/server";

// ... Keep your Date/Time helper functions here (dateFromYMD, etc.) ...
// (I have omitted them for brevity, but keep them in your file)
function dateFromYMD(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}
function timeFromHM(time: string | null | undefined): Date | null {
  if (!time) return null;
  const normalized = time.length === 5 ? `${time}:00` : time;
  return new Date(`1970-01-01T${normalized}Z`);
}
function toYMD(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}
function toHM(d: Date | null | undefined): string {
  if (!d) return "";
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET() {
  const supabase = await createClient();

  // FIX: Use getUser instead of getSession for better security in App Router
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth Error:", authError); // Log this for Vercel
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const entries = await getEntriesByUser(user.id);

    const formatted = entries.map((e) => ({
      id: e.id,
      date: toYMD(e.date as unknown as Date),
      morning_time_in: toHM(e.morning_time_in as unknown as Date),
      morning_time_out: toHM(e.morning_time_out as unknown as Date),
      afternoon_time_in: toHM(e.afternoon_time_in as unknown as Date),
      afternoon_time_out: toHM(e.afternoon_time_out as unknown as Date),
      evening_time_in: toHM(e.evening_time_in as unknown as Date),
      evening_time_out: toHM(e.evening_time_out as unknown as Date),
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // This logs the ACTUAL database error to Vercel Function Logs
    console.error("Database/Server Error:", error); 
    
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    date,
    morning_time_in,
    morning_time_out,
    afternoon_time_in,
    afternoon_time_out,
    evening_time_in,
    evening_time_out,
  } = body as Entries;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const input = entriesSchema.parse({
      date,
      morning_time_in,
      morning_time_out,
      afternoon_time_in,
      afternoon_time_out,
      evening_time_in: evening_time_in ?? null,
      evening_time_out: evening_time_out ?? null,
      created_by: user.id,
    });

    const toCreate: Omit<Entries, "id" | "created_at"> = {
      date: dateFromYMD(input.date),
      morning_time_in: input.morning_time_in ? timeFromHM(input.morning_time_in) : null,
      morning_time_out: input.morning_time_out ? timeFromHM(input.morning_time_out) : null,
      afternoon_time_in: input.afternoon_time_in ? timeFromHM(input.afternoon_time_in) : null,
      afternoon_time_out: input.afternoon_time_out ? timeFromHM(input.afternoon_time_out) : null,
      evening_time_in: input.evening_time_in ? timeFromHM(input.evening_time_in) : null,
      evening_time_out: input.evening_time_out ? timeFromHM(input.evening_time_out) : null,
      created_by: input.created_by,
    };

    const newEntry = await createEntries(toCreate);

    const responseBody = {
      id: newEntry.id,
      date: toYMD(newEntry.date as unknown as Date),
      morning_time_in: toHM(newEntry.morning_time_in as unknown as Date),
      morning_time_out: toHM(newEntry.morning_time_out as unknown as Date),
      afternoon_time_in: toHM(newEntry.afternoon_time_in as unknown as Date),
      afternoon_time_out: toHM(newEntry.afternoon_time_out as unknown as Date),
      evening_time_in: toHM(newEntry.evening_time_in as unknown as Date),
      evening_time_out: toHM(newEntry.evening_time_out as unknown as Date),
    };

    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST Error:", error);
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ errors: error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}