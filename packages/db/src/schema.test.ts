import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  users,
  problemes,
  pistes,
  pisteAliases,
  threads,
  threadPisteMentions,
  pisteRatings,
  bookmarks,
  commentaires,
  searchLog,
} from './schema.js';

describe('schema', () => {
  it('expose les 9 tables du §3 architecture + users', () => {
    const names = [
      problemes,
      pistes,
      pisteAliases,
      threads,
      threadPisteMentions,
      pisteRatings,
      bookmarks,
      commentaires,
      searchLog,
      users,
    ].map(getTableName);

    expect(names).toEqual([
      'problemes',
      'pistes',
      'piste_aliases',
      'threads',
      'thread_piste_mentions',
      'piste_ratings',
      'bookmarks',
      'commentaires',
      'search_log',
      'users',
    ]);
  });
});
