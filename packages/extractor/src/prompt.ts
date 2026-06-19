import type { ParsedThread } from './types.js';

export const SYSTEM_PROMPT = `Tu es un expert en diagnostic mécanique automobile. Tu analyses un thread de forum francophone et tu en extraits une structure de connaissance utilisable.

Vocabulaire imposé :
- "probleme" : le symptôme/panne discuté dans le thread (ex: "1.5 dCi K9K cale à chaud")
- "piste" : une cause possible évoquée dans le thread (ex: "Capteur PMH", "Pompe gavage")

Pour CHAQUE piste mentionnée dans le thread, tu classes son statut :
- "confirmed" : testée par l'auteur ou un répondant, elle a RÉSOLU le problème
- "tested_neutral" : testée, sans effet (rien changé)
- "tested_negative" : testée, situation AGGRAVÉE
- "mentioned" : suggérée par quelqu'un mais PAS testée dans le thread

Règles strictes :
- Ne JAMAIS inventer une piste qui n'est pas dans le thread
- Les noms de pistes doivent être canoniques et courts ("Capteur PMH", pas "le capteur de position du moteur")
- L'extrait doit être une citation textuelle ou quasi-textuelle du thread (≤ 300 caractères)
- confidence ∈ [0, 1] reflète à quel point tu es sûr du statut affecté
- Si le thread mentionne 0 piste claire, renvoie pistes: []
- Si tu ne sais pas si c'est résolu, mets resolved_in_thread: false et cause_finale: null
- Réponds UNIQUEMENT en JSON valide selon le schéma demandé, rien d'autre`;

export function buildUserPrompt(thread: ParsedThread): string {
  const postsRendu = thread.posts
    .slice(0, 40)
    .map(
      (p, i) => `--- Post ${i + 1} (${p.author}, ${p.date ?? 'date inconnue'}) ---\n${p.content}`,
    )
    .join('\n\n');

  return `Thread : "${thread.titre}"
URL : ${thread.url}
Forum : ${thread.forum}
Date : ${thread.date_thread ?? 'inconnue'}

Contenu (${thread.posts.length} posts, ${thread.nb_pages} page(s)) :

${postsRendu}

Renvoie un JSON conforme à ce schéma :
{
  "probleme": {
    "titre": "string (court, descriptif)",
    "vehicules": ["string", ...],
    "symptomes": ["string", ...]
  },
  "pistes": [
    {
      "titre": "string (canonique, court)",
      "statut": "confirmed" | "tested_neutral" | "tested_negative" | "mentioned",
      "extrait": "string (≤300 char, citation)",
      "confidence": 0.0
    }
  ],
  "cause_finale": "string ou null (nom de la piste qui a résolu, s'il y en a une)",
  "resolved_in_thread": false
}`;
}
