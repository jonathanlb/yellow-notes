import Debug from 'debug';
import { Author, Note } from './notes';

const debug = Debug('yellow-searchworkspace');

export type SearchColumn = {
  notes: Map<string, Note>;
  notesOrder: Array<string>;
  title: string;
};

export class SearchWorkSpaceModel {
  actionId: number;
  authors: Map<string, Author>;
  columns: Array<SearchColumn>;

  constructor() {
    this.actionId = 0;
    this.authors = new Map();
    this.columns = [];
  }

  addAuthor(author: Author) {
    this.authors.set(author.id(), author);
    return this.actionId++;
  }

  addNote(note: Note, spaceIdx: number) {
    const col = this.columns[spaceIdx];
    const nid = note.id();
    col.notes.set(nid, note);
    col.notesOrder.push(nid);
    return this.actionId++;
  }

  addSpace(title: string) {
    this.columns.splice(0, 0, {
      notes: new Map<string, Note>(),
      notesOrder: [],
      title: title,
    });
    return this.actionId++;
  }

  deleteNote(spaceIdx: number, noteIdx: number) {
    const col = this.columns[spaceIdx];
    const noteId = col.notesOrder[noteIdx];
    col.notes.delete(noteId);
    col.notesOrder.splice(noteIdx, 1);
    return this.actionId++;
  };

  deleteSpace(spaceIdx: number) {
    this.columns.splice(spaceIdx, 1);
    return this.actionId++;
  }

  getAuthor(id: string) {
    return this.authors.get(id);
  }

  reorderNote(
    srcSpace: number, srcIndex: number,
    destSpace: number, destIdx: number) {
    debug('reorder', srcSpace, srcIndex, destSpace, destIdx);
    const srcCol = this.columns[srcSpace];
    const destCol = this.columns[destSpace];
    const noteId = srcCol.notesOrder[srcIndex];

    srcCol.notesOrder = srcCol.notesOrder.filter(x => x !== noteId);
    destCol.notesOrder.splice(destIdx, 0, noteId);

    if (srcCol !== destCol) {
      const note = srcCol.notes.get(noteId) as Note;
      srcCol.notes.delete(noteId);
      destCol.notes.set(noteId, note);
    }
    return this.actionId++;
  }
};