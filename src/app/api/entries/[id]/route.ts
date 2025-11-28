import {
  deleteEntry,
  entriesSchema,
  getEntriesByID,
  updateEntry,
} from "@/app/modules/entries";
import { NextRequest } from "next/server";
import { Entries } from "../../../../../generated/prisma";
import { ZodError } from "zod";
import { createClient } from "@/utils/supabase/server";

/**
 * Helpers to convert between strings and Date objects
 */
function dateFromYMD(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function timeFromHM(time: string | null | undefined): Date | null {
  if (!time) return null;
  const normalized = time.length === 5 ? `${time}:00` : time;
  return new Date(`1970-01-01T${normalized}Z`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
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

  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(); // <--- CRITICAL FIX

  if (authError || !user) {
    console.error("PUT Auth Error:", authError);
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Make sure to use 'user.id' instead of 'session.user.id' below
  const session = { user }; // Mock session object for compatibility

  if (!id) {
    return new Response(
      JSON.stringify({ error: "The requested resource could not be found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate the incoming string payload
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

    const existingEntry = await getEntriesByID(Number(id), session.user.id);

    if (!existingEntry) {
      return new Response(
        JSON.stringify({ error: "The requested resource could not be found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert validated strings into Date objects expected by Prisma
    const toUpdate: Omit<Entries, "id" | "created_at"> = {
      date: dateFromYMD(input.date),
      morning_time_in: timeFromHM(input.morning_time_in),
      morning_time_out: timeFromHM(input.morning_time_out),
      afternoon_time_in: timeFromHM(input.afternoon_time_in),
      afternoon_time_out: timeFromHM(input.afternoon_time_out),
      evening_time_in: timeFromHM(input.evening_time_in ?? null),
      evening_time_out: timeFromHM(input.evening_time_out ?? null),
      created_by: input.created_by,
    };

    await updateEntry(Number(id), session.user.id, toUpdate);

    return new Response(null, {
      status: 204,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(); // <--- CRITICAL FIX

  if (authError || !user) {
    console.error("DELETE Auth Error:", authError);
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Make sure to use 'user.id' instead of 'session.user.id' below
  const session = { user }; // Mock session object for compatibility

  try {
    const existingEntry = await getEntriesByID(Number(id), session.user.id);

    if (!existingEntry) {
      return new Response(
        JSON.stringify({ error: "The requested resource could not be found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await deleteEntry(Number(id), session.user.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Unknown error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}