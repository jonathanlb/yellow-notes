import { Search, Topic } from '@mui/icons-material';
import { Box, Paper, TextField, Tooltip } from '@mui/material';
import Debug from 'debug';
import { useEffect, useState } from 'react';
import { DragDropContext, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import './App.css';
import { newSearchColumnProps, SearchColumnDiv } from './components/SearchColumn';
import { DemoServerInterface } from './controller/ServerInterface';
import { SearchColumn } from './model/searchWorkspace';

const debug = Debug('yellow-app');

const noteController = new DemoServerInterface();

function App() {
  const [columns, setColumns] = useState([] as Array<SearchColumn>);
  useEffect(() => {
    const sub = noteController.getSpaces().subscribe(setColumns);
    noteController.updateSubscribers(); // make sure to render data on mount
    return () => sub.unsubscribe();
  }, []);

  const newSearch = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter') {
      const searchTerm = (e.target as any)?.value?.toString()?.trim();
      noteController.addSpace(searchTerm); // TODO issue search
    }
  }

  const newSpace = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter') {
      const title = (e.target as any)?.value?.toString()?.trim();
      noteController.addSpace(title);
    }
  }

  const onDragEnd = (result: DropResult, _provided?: ResponderProvided) => {
    const { source, destination, draggableId } = result;
    debug('onDragEnd', source, destination, draggableId);
    if (!destination) {
      return;
    }

    const srcColId = parseInt(source.droppableId, 10);
    const destColId = parseInt(destination.droppableId, 10);
    noteController.reorderNote(
      srcColId, source.index,
      destColId, destination.index);
  }

  return (
    <Paper className='App'>
      <Box className='SearchDiv'>
        <Box className='NewSearchInputDiv'>
          <Tooltip title='New Search'>
            <TextField className='NewSearchInput'
              label={<Search />}
              onKeyUp={newSearch} />
          </Tooltip>
        </Box>

        <Box className='NewSearchInputDiv'>
          <Tooltip title='New Space'>
            <TextField className='NewSearchInput'
              label={<Topic />}
              onKeyUp={newSpace} />
          </Tooltip>
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {
          columns.map((c, i) => {
            debug('render', i);
            return SearchColumnDiv(
              newSearchColumnProps(
                c, i,
                () => noteController.deleteSpace(i),
                (n) => noteController.deleteNote(i, n)
              ));
          })
        }
      </DragDropContext>
    </Paper>
  );
}

export default App;
