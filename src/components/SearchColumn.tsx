import { Box, Typography } from "@mui/material";
import { Droppable, DroppableProvided } from "react-beautiful-dnd";
import { Note } from "../model/notes";
import { SearchColumn } from "../model/searchWorkspace";
import { newNoteProps, NoteDiv } from "./Note";
import './SearchColumn.css';
import Debug from 'debug';
import { Close } from "@mui/icons-material";

const debug = Debug('yellow-SearchColumn');

export interface SearchColumnProps extends SearchColumn {
  closeNote: (noteIdx: number) => void;
  closeSearchCol: () => void;
  id: string;
  key: number;
}

export function newSearchColumnProps(
  col: SearchColumn,
  index: number,
  closeSearchCol: () => void,
  closeNote: (noteIdx: number) => void):
  SearchColumnProps {
  return {
    closeNote: closeNote,
    closeSearchCol: closeSearchCol,
    id: index.toString(),
    key: index,
    notes: col.notes,
    notesOrder: col.notesOrder,
    title: col.title,
  };
}

export function SearchColumnDiv(props: SearchColumnProps) {
  debug('render', props);

  const createNoteProps = (note: Note, colIdx: number, noteIdx: number) => {
    return newNoteProps(
      note, noteIdx,
      () => props.closeNote(noteIdx));
  }

  return (
    <Droppable droppableId={props.id} key={props.key}>
      {(droppableProvided: DroppableProvided) =>
        <Box className='SearchColumnDiv' key={props.key}>
          <Box className='SearchColumnHeader'>
            <Typography>{props.title}</Typography>
            <Close
              sx={{marginRight: 0, marginLeft: 'auto'}}
              onClick={props.closeSearchCol}/>
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