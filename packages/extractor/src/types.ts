import { z } from 'zod';

export const StatutPisteSchema = z.enum([
  'confirmed',
  'tested_neutral',
  'tested_negative',
  'mentioned',
]);
export type StatutPiste = z.infer<typeof StatutPisteSchema>;

export const ProblemeSchema = z.object({
  titre: z.string().min(3).max(200),
  vehicules: z.array(z.string()),
  symptomes: z.array(z.string()).min(1),
});
export type Probleme = z.infer<typeof ProblemeSchema>;

export const PisteExtraiteSchema = z.object({
  titre: z.string().min(2).max(120),
  statut: StatutPisteSchema,
  extrait: z.string().max(300),
  confidence: z.number().min(0).max(1),
});
export type PisteExtraite = z.infer<typeof PisteExtraiteSchema>;

export const ExtractionItemSchema = z.object({
  probleme: ProblemeSchema,
  pistes: z.array(PisteExtraiteSchema),
  cause_finale: z.string().nullable(),
  resolved_in_thread: z.boolean(),
});
export type ExtractionItem = z.infer<typeof ExtractionItemSchema>;

export const ExtractionSchema = z.object({
  problemes: z.array(ExtractionItemSchema),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

export const ThreadPostSchema = z.object({
  author: z.string(),
  date: z.string().nullable(),
  content: z.string(),
});
export type ThreadPost = z.infer<typeof ThreadPostSchema>;

export const ParsedThreadSchema = z.object({
  url: z.string().url(),
  forum: z.string(),
  titre: z.string(),
  date_thread: z.string().nullable(),
  nb_pages: z.number().int().positive(),
  posts: z.array(ThreadPostSchema),
  langue_origine: z.enum(['fr', 'en']).default('fr'),
});
export type ParsedThread = z.infer<typeof ParsedThreadSchema>;

export const ExtractionRunSchema = z.object({
  schema_version: z.literal(1),
  source_model: z.string(),
  extracted_at: z.string().datetime(),
  thread: ParsedThreadSchema,
  extraction: ExtractionSchema,
});
export type ExtractionRun = z.infer<typeof ExtractionRunSchema>;
