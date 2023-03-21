import { Box, Typography } from '@mui/material';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import ReactMarkdown from 'react-markdown';
import { Note } from '../model/notes';
import './Note.css';
import Debug from 'debug';
import { Close, ContentCopy } from "@mui/icons-material";

const debug = Debug('yellow-Note');

export interface NoteProps extends Note {
  close: () => void;
  index: number,
  key: string
};

function formatDate(epochS: number): string {
  return new Date(epochS * 1000).toLocaleDateString();
}

export function newNoteProps(
  note: Note,
  index: number,
  close: () => void):
  NoteProps {
  return {
    close: close,
    index: index,
    key: note.id(),
    author: note.author,
    content: note.content,
    creationS: note.creationS,
    id: note.id,
    title: note.title,
  }
}

let divIdCounter = 0;

export function NoteDiv(props: NoteProps) {
  debug('render', props);

  const divId = 'SearchColumnDiv-' + (divIdCounter++);

  const copyContent = (e: React.MouseEvent<Element, MouseEvent>) => {
    const range = document.createRange();
    const el = document.getElementById(divId);
    if (!el) {
      return;
    }
    range.selectNode(el);
    window.getSelection()?.addRange(range);
    document.execCommand("copy");
    window.getSelection()?.removeAllRanges();// to deselect
  }
  return (
    <Draggable 
      draggableId={props.id()}
      index={props.index}
      key={props.index} >
      {(draggableProvided: DraggableProvided, snapshot: DraggableStateSnapshot) =>
        <Box className='NoteDiv' id={divId}
          ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}
          {...draggableProvided.dragHandleProps}
          style={{
            ...draggableProvided.draggableProps.style,
            background: snapshot.isDragging
              ? "rgba(245,245,245, 0.75)"
              : "none"
          }}>
          <Box className='NoteHeader'>
            <Typography className='AuthorName'>
              {props.author().name()}
            </Typography>
            <Typography className='NoteTitle'>
              {props.title()}
            </Typography>
            <ContentCopy onClick={copyContent} />
            <Typography className='NoteDate'>
              {formatDate(props.creationS())}
            </Typography>
            <Close
              sx={{marginRight: 0, marginLeft: 'auto'}}
              onClick={props.close}/>
          </Box>
          <ReactMarkdown className='NoteContent'>
            {props.content()}
          </ReactMarkdown>
        </Box>
      }
    </Draggable>
  );
}