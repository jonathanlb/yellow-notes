import { Close, DateRange, Score } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import Debug from 'debug';
import { Droppable, DroppableProvided } from 'react-beautiful-dnd';
import { Note } from '../model/notes';
import { SearchColumn } from '../model/searchWorkspace';
import { newNoteProps, NoteDiv } from './Note';
import './SearchColumn.css';

const debug = Debug('yellow-SearchColumn');

export interface NotePrivacy {
  noteId: number,
  privacy: number
}

export interface SearchColumnProps extends SearchColumn {
  closeNote: (noteIdx: number) => void;
  closeSearchCol: () => void;
  setNotePrivacy: (id: string, privacy: number) => void,
  sortByDate: () => void;
  sortByScore: () => void;
  id: string;
  key: number;
}

export function newSearchColumnProps(
  col: SearchColumn,
  index: number,
  closeSearchCol: () => void,
  closeNote: (noteIdx: number) => void,
  setNotePrivacy: (id: string, privacy: number) => void,
  sortByDate: () => void,
  sortByScore: () => void):
  SearchColumnProps {
  return {
    closeNote: closeNote,
    closeSearchCol: closeSearchCol,
    setNotePrivacy: setNotePrivacy,
    sortByDate: sortByDate,
    sortByScore: sortByScore,
    id: index.toString(),
    key: index,
    notes: col.notes,
    notesOrder: col.notesOrder,
    title: col.title,
  };
}

export function SearchColumnDiv(props: SearchColumnProps) {
  debug('render', props);

  const createNoteProps = (
    note: Note,
    colIdx: number,
    noteIdx: number,
    ) => {
    debug('creating-note-from', props);
    debug('build-note', note, colIdx, noteIdx);

    const noteSetPrivacy = (p: number) => {
      props.setNotePrivacy(note.id(), p);
    }

    return newNoteProps(
      note,
      noteIdx,
      () => props.closeNote(noteIdx),
      noteSetPrivacy);
  }

  return (
    <Droppable droppableId={props.id} key={props.key}>
      {(droppableProvided: DroppableProvided) =>
        <Box className='SearchColumnDiv' key={props.key}>
          <Box className='SearchColumnHeader'>
            <Typography>{props.title}</Typography>
            <Tooltip title='Order by date'>
              <DateRange onClick={props.sortByDate} />
            </Tooltip>
            <Tooltip title='Order by score'>
              <Score onClick={props.sortByScore} />
            </Tooltip>
            <Tooltip title='Close space'>
              <Close
                sx={{marginRight: 0, marginLeft: 'auto'}}
                onClick={props.closeSearchCol}/>
            </Tooltip>
          </Box>
          <Box ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}>
            {props.notesOrder.map((k, i) =>
              <NoteDiv {...createNoteProps(props.notes.get(k) as Note, props.key, i)} />
            )}
          </Box>
          {droppableProvided.placeholder}
        </Box>
      }
    </Droppable>
  )
}