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

export type NoteData = {
  author: Author;
  content: string;
  creationS: number;
  id: string;
  title: string;
};

export interface Note {
  author: () => Author;
  content: () => string;
  creationS: () => number;
  id: () => string;
  title: () => string;
};

export function newNote(note: NoteData): Note {
  return {
    author: () => note.author,
    content: () => note.content,
    creationS: () => note.creationS,
    id: () => note.id,
    title: () => note.title,
  };
}
