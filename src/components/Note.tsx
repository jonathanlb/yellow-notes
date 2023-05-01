import { Box, Tooltip, Typography } from '@mui/material';
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
    score: note.score
  }
}

let divIdCounter = 0;

export function NoteDiv(props: NoteProps) {
  debug('render', props);

  const divId = 'SearchColumnDiv-' + (divIdCounter++);

  const copyContent = (e: React.MouseEvent<Element, MouseEvent>) => {
    const div = document.getElementById(divId);
    const el = div?.querySelector('.NoteContent');
    debug('content', el);
    debug('content html', el?.innerHTML);
    const type = 'text/html';
    const blob = new Blob([el?.innerHTML as string], { type });
    navigator.clipboard.write([new ClipboardItem({ [type]: blob})]);
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
            <Tooltip title='Author'>
              <Typography className='AuthorName'>
                {props.author().name()}
              </Typography>
            </Tooltip>

            {props.score !== undefined &&
              <Tooltip title='Score'>
                <Typography className='NoteScore'>
                  ({props.score})
                </Typography>
              </Tooltip>
            }

            <Tooltip title='Copy to clipboard'>
              <ContentCopy onClick={copyContent} />
            </Tooltip>
            <Tooltip title='Creation date'>
              <Typography className='NoteDate'>
                {formatDate(props.creationS())}
              </Typography>
            </Tooltip>
            <Tooltip title='Close note'>
              <Close
                sx={{ marginRight: 0, marginLeft: 'auto' }}
                onClick={props.close} />
            </Tooltip>
          </Box>
          <ReactMarkdown className='NoteContent' linkTarget='_blank'>
            {props.content()}
          </ReactMarkdown>
        </Box>
      }
    </Draggable>
  );
}