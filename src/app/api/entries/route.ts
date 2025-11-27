import { NextRequest } from "next/server";
import {
  createEntries,
  getEntriesByUser,
} from "../../modules/entries/repository";
import { Entries } from "../../../../generated/prisma";
import { entriesSchema } from "@/app/modules/entries";
import { ZodError } from "zod";

import { createClient } from "@/utils/supabase/server";

/**
 * Helpers to convert between DB Date/Time and the simple strings
 * used by the frontend ("YYYY-MM-DD" and "HH:MM").
 */

function dateFromYMD(ymd: string): Date {
  // e.g. "2025-02-05" -> Date at midnight UTC
  return new Date(`${ymd}T00:00:00.000Z`);
}

function timeFromHM(time: string | null | undefined): Date | null {
  if (!time) return null;
  // normalize "HH:MM" -> "HH:MM:00"
  const normalized = time.length === 5 ? `${time}:00` : time;
  // Any date is fine for Postgres TIME; Prisma ignores the date part.
  return new Date(`1970-01-01T${normalized}Z`);
}

function toYMD(d: Date | null | undefined): string {
  if (!d) return "";
  // yyyy-mm-dd
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const entries = await getEntriesByUser(session.user.id);

    // Prisma now returns Date objects for date/time columns.
    // Map them back to the simple strings the frontend expects.
    const formatted = entries.map((e) => ({
      id: e.id,
      date: toYMD(e.date as unknown as Date),
      morning_time_in: toHM(e.morning_time_in as unknown as Date),
      morning_time_out: toHM(e.morning_time_out as unknown as Date),
      afternoon_time_in: toHM(e.afternoon_time_in as unknown as Date),
      afternoon_time_out: toHM(e.afternoon_time_out as unknown as Date),
      evening_time_in: toHM(e.evening_time_in as unknown as Date),
      evening_time_out: toHM(e.evening_time_out as unknown as Date),
      // created_by / created_at not needed by the current UI,
      // but you can include them if you want.
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Validate the incoming string payload with your Zod schema
    const input = entriesSchema.parse({
      date,
      morning_time_in,
      morning_time_out,
      afternoon_time_in,
      afternoon_time_out,
      evening_time_in: evening_time_in ?? null,
      evening_time_out: evening_time_out ?? null,
      created_by: session.user.id,
    });

    // Convert validated strings into Date objects expected by Prisma
    const toCreate: Omit<Entries, "id" | "created_at"> = {
      date: dateFromYMD(input.date) as any,
      morning_time_in: timeFromHM(input.morning_time_in) as any,
      morning_time_out: timeFromHM(input.morning_time_out) as any,
      afternoon_time_in: timeFromHM(input.afternoon_time_in) as any,
      afternoon_time_out: timeFromHM(input.afternoon_time_out) as any,
      evening_time_in: timeFromHM(input.evening_time_in ?? null) as any,
      evening_time_out: timeFromHM(input.evening_time_out ?? null) as any,
      created_by: input.created_by,
    };

    const newEntry = await createEntries(toCreate);

    // Send back formatted strings again so the frontend TimeEntry type still matches
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
    console.log(error);
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ errors: error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
