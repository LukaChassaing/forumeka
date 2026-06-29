/**
 * Liste curatée des forums/sous-forums à indexer. Volontairement maintenue à la main (pas
 * d'auto-découverte des sous-forums) pour éviter d'indexer des sections hors-sujet (présentations,
 * petites annonces, blagues...). Étendre cette liste = la façon principale d'indexer plus de contenu.
 */
export interface SubForumSource {
  url: string;
  label: string;
}

export interface ForumSource {
  forum: string;
  subforums: SubForumSource[];
}

export const SOURCES: ForumSource[] = [
  {
    forum: 'forum4x4.org',
    subforums: [
      { url: 'https://www.forum4x4.org/viewforum.php?f=26', label: 'Mécanique et réparations' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=28', label: '4x4 : La pratique' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=24', label: 'Pneumatiques et suspensions' },
      // Forums par marques — gros volume de pannes spécifiques à un modèle/moteur.
      { url: 'https://www.forum4x4.org/viewforum.php?f=15', label: 'Marque : Lada' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=16', label: 'Marque : Land-rover' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=14', label: 'Marque : Jeep' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=17', label: 'Marque : Mercedes' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=18', label: 'Marque : Mitsubishi' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=19', label: 'Marque : Nissan' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=20', label: 'Marque : Opel' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=21', label: 'Marque : Suzuki' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=22', label: 'Marque : Toyota' },
      { url: 'https://www.forum4x4.org/viewforum.php?f=83', label: 'Marque : Autres marques' },
    ],
  },
];
