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
    ],
  },
];
