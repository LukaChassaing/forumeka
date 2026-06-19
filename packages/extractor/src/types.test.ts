import { describe, it, expect } from 'vitest';
import { ExtractionSchema } from './types.js';

describe('ExtractionSchema', () => {
  it('accepte une extraction valide à un seul problème', () => {
    const ok = ExtractionSchema.safeParse({
      problemes: [
        {
          probleme: {
            titre: '1.5 dCi K9K cale à chaud',
            vehicules: ['Clio 3 K9K'],
            symptomes: ['calage à chaud'],
          },
          pistes: [
            {
              titre: 'Capteur PMH',
              statut: 'confirmed',
              extrait: 'Après remplacement du PMH plus aucun calage.',
              confidence: 0.9,
            },
          ],
          cause_finale: 'Capteur PMH',
          resolved_in_thread: true,
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('accepte une extraction à plusieurs problèmes distincts', () => {
    const ok = ExtractionSchema.safeParse({
      problemes: [
        {
          probleme: { titre: 'Fuite injecteur', vehicules: ['Trafic G9U'], symptomes: ['fuite'] },
          pistes: [],
          cause_finale: null,
          resolved_in_thread: false,
        },
        {
          probleme: { titre: 'Bruit distribution', vehicules: ['Trafic G9U'], symptomes: ['claquement'] },
          pistes: [
            {
              titre: 'Galet tendeur',
              statut: 'confirmed',
              extrait: 'plus de bruit après changement du galet tendeur',
              confidence: 0.8,
            },
          ],
          cause_finale: 'Galet tendeur',
          resolved_in_thread: true,
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('rejette un statut inconnu', () => {
    const ko = ExtractionSchema.safeParse({
      problemes: [
        {
          probleme: { titre: 't', vehicules: ['v'], symptomes: ['s'] },
          pistes: [{ titre: 'x', statut: 'maybe', extrait: '', confidence: 0.5 }],
          cause_finale: null,
          resolved_in_thread: false,
        },
      ],
    });
    expect(ko.success).toBe(false);
  });

  it('rejette une confidence hors borne', () => {
    const ko = ExtractionSchema.safeParse({
      problemes: [
        {
          probleme: { titre: 't', vehicules: ['v'], symptomes: ['s'] },
          pistes: [{ titre: 'x', statut: 'mentioned', extrait: '', confidence: 1.5 }],
          cause_finale: null,
          resolved_in_thread: false,
        },
      ],
    });
    expect(ko.success).toBe(false);
  });

  it('rejette un tableau de problemes vide', () => {
    const ko = ExtractionSchema.safeParse({ problemes: [] });
    expect(ko.success).toBe(false);
  });
});
