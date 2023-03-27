import { newAuthor, newNote } from '../notes';
import { SearchWorkSpaceModel } from '../searchWorkspace';

test('searchWorkspace moves note', () => {
  const sws = new SearchWorkSpaceModel();
  sws.addSpace('Read');
  sws.addSpace('Unread');
  const author = newAuthor({ id: '1', name: 'Michael Russo'});
  sws.addAuthor(author);

  const note = newNote({
    author: author,
    content: 'Wild win',
    creationS: new Date().getSeconds(),
    id: '11',
    title: 'Hockey News'
  });
  sws.addNote(note, 0);
  sws.reorderNote(0, 0, 1, 0);

  expect(sws.columns.length).toBe(2);

  expect(sws.columns[0].notesOrder.length).toBe(0);
  expect(sws.columns[0].notes.size).toBe(0);

  expect(sws.columns[1].notesOrder.length).toBe(1);
  expect(sws.columns[1].notes.size).toBe(1);
});

test('searchWorkspace reorders notes', () => {
  const sws = new SearchWorkSpaceModel();
  sws.addSpace('Unread');
  const author = newAuthor({ id: '1', name: 'Michael Russo'});
  sws.addAuthor(author);

  let note = newNote({
    author: author,
    content: 'Wild win',
    creationS: new Date().getSeconds(),
    id: '11',
    title: 'Hockey News'
  });
  sws.addNote(note, 0);

  note = newNote({
    author: author,
    content: 'Wild win again',
    creationS: new Date().getSeconds(),
    id: '12',
    title: 'Hockey News'
  });
  sws.addNote(note, 0);

  sws.reorderNote(0, 0, 0, 1);

  expect(sws.columns.length).toBe(1);

  expect(sws.columns[0].notesOrder.length).toBe(2);
  expect(sws.columns[0].notes.size).toBe(2);
});