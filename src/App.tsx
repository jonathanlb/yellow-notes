import { Search, Topic } from '@mui/icons-material';
import { Create, Logout } from '@mui/icons-material';
import { Box, Button, Paper, TextField, Tooltip } from '@mui/material';
import Debug from 'debug';
import { useEffect, useState } from 'react';
import { DragDropContext, DropResult, ResponderProvided } from 'react-beautiful-dnd';
import './App.css';
import { LoginDiv } from './components/Login';
import { SearchColumnDiv, newSearchColumnProps } from './components/SearchColumn';
import { DemoServerInterface } from './controller/DemoServerInterface';
import { NetworkServerInterface } from './controller/NetworkServerInterface';
import { SearchColumn } from './model/searchWorkspace';
import { EditNoteDiv } from './components/EditNote';

const debug = Debug('yellow-app');

const demo = false;

const noteController = demo ?
  new DemoServerInterface() :
  new NetworkServerInterface();

function App() {
  const [columns, setColumns] = useState([] as Array<SearchColumn>);
  const [isEditing, setIsEditing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const subs = [
      noteController.getSpaces().subscribe(setColumns),
      noteController.getLoggedIn().subscribe(setLoggedIn)
    ];
    noteController.updateSubscribers(); // make sure to render data on mount
    return () => subs.forEach(sub => sub.unsubscribe());
  }, []);

  const newSearch = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Enter') {
      const searchTerm = (e.target as any)?.value?.toString()?.trim();
      noteController.addSpace(searchTerm);
      noteController.search(searchTerm, 0);
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

  if (!loggedIn) {
    return (
      <LoginDiv login={noteController.login}/>
    );
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

        <Tooltip title='New Note'>
          <Button
            onClick={e=>setIsEditing(true)}>
            <Create/>
          </Button>
        </Tooltip>

        <Tooltip title='Logout'>
          <Button className='LogoutButton'
            onClick={e=>noteController.logout()}>
            <Logout/>
          </Button>
        </Tooltip>
      </Box>

      { isEditing ?
        <EditNoteDiv
          cancel={()=>setIsEditing(false)}
          save={noteController.saveNote}
          /> :
          undefined
      }

      <Box className="SearchPanesDiv">
      <DragDropContext onDragEnd={onDragEnd}>
        {
          columns.map((c, i) => {
            debug('render', i);
            return SearchColumnDiv(
              newSearchColumnProps(
                c, i,
                () => noteController.deleteSpace(i),
                (n) => noteController.deleteNote(i, n),
                () => noteController.orderNotesByDate(i),
                () => noteController.orderNotesByScore(i),
              ));
          })
        }
      </DragDropContext>
      </Box>
    </Paper>
  );
}

export default App;
