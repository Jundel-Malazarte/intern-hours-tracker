import { z } from "zod";

export const entriesSchema = z.object({
  date: z.string(),
  morning_time_in: z.string().optional().or(z.literal("")).nullable(),
  morning_time_out: z.string().optional().or(z.literal("")).nullable(),
  afternoon_time_in: z.string().optional().or(z.literal("")).nullable(),
  afternoon_time_out: z.string().optional().or(z.literal("")).nullable(),
  evening_time_in: z.string().optional().or(z.literal("")).nullable(),
  evening_time_out: z.string().optional().or(z.literal("")).nullable(),
  created_by: z.string(),
});

export { deleteEntry, getEntriesByID, updateEntry } from "../../modules/entries/repository";