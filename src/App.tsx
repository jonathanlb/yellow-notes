import { Search } from '@mui/icons-material';
import { Box, Paper, TextField, Tooltip } from '@mui/material';
import Debug from 'debug';
import { useState } from 'react';
import { DragDropContext, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import './App.css';
import { newSearchColumnProps, SearchColumnDiv } from './components/SearchColumn';
import { Author, newAuthor, newNote } from './model/notes';
import { SearchWorkSpaceModel } from './model/searchWorkspace';

const debug = Debug('yellow-app');

const noteState = new SearchWorkSpaceModel();
noteState.addAuthor(newAuthor({id: '1', name: 'Jonathan'}));
noteState.addSpace('TODOs');
noteState.addNote(
  newNote({
    author: noteState.getAuthor('1') as Author,
    content: '- Do something new\n- It\'s \u03C0 Day',
    creationS: 1678808892,
    id: '11',
    title: 'TODO'
  }),
  0);
noteState.addNote(
  newNote({
    author: noteState.getAuthor('1') as Author,
    content: '💩',
    creationS: 1678809892,
    id: '12',
    title: 'Remember Something'
  }),
  0);



function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ _, setNoteAction ] = useState(0);

  const newSearch = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter') {
      const searchTerm = (e.target as any)?.value?.toString()?.trim();
      const a = noteState.addSpace(searchTerm);
      setNoteAction(a);
    }
  }

  const onDragEnd = (result: DropResult, provided?: ResponderProvided) => {
    const { source, destination, draggableId } = result;
    debug('onDragEnd', source, destination, draggableId);
    if (!destination) {
      return;
    }

    if (destination.index === source.index) {
      return;
    }

    const srcColId = parseInt(source.droppableId, 10);
    const destColId = parseInt(destination.droppableId, 10);
    const a = noteState.reorderNote(
      srcColId, source.index,
      destColId, destination.index);

    setNoteAction(a);
  }

  return (
    <Paper className='App'>
      <Box className='SearchDiv'>
        <Tooltip title='New Search'>
          <TextField className='NewSearchDiv'
            label={<Search />}
            id="eventFilterText"
            onKeyUp={newSearch} />
        </Tooltip>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {
          noteState.columns.map((c, i) => {
            debug('render', i);
            return SearchColumnDiv(
              newSearchColumnProps(
                c, i,
                () => setNoteAction(noteState.deleteSpace(i)),
                (n) => setNoteAction(noteState.deleteNote(i, n))
              ));
          })
        }
      </DragDropContext>
    </Paper>
  );
}

export default App;
