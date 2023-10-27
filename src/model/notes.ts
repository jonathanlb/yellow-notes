export type AuthorData = {
  id: string,
  name: string,
};

export interface Author {
  id: () => string;
  name: () => string;
};

export function newAuthor(author: AuthorData): Author {
  return {
    id: () => author.id,
    name: () => author.name,
  }
}

// from go-notes/pkg/notes/notes.go
export const PRIVATE_ACCESS = 0;
export const PROTECTED_ACCESS = 1;
export const PUBLIC_ACCESS = 2;
export const DEFAULT_ACCESS = PROTECTED_ACCESS;

export type NoteData = {
  author: Author;
  content: string;
  creationS: number;
  id: string;
  privacy: number;
  score?: number;
};

export interface Note {
  author: () => Author;
  content: () => string;
  creationS: () => number;
  id: () => string;
  privacy: number;
  score?: number;
};

export function newNote(note: NoteData): Note {
  return {
    author: () => note.author,
    content: () => note.content,
    creationS: () => note.creationS,
    id: () => note.id,
    privacy: note.privacy,
    score: note.score,
  };
}
