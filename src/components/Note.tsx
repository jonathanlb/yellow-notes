import { Box, Tooltip, Typography } from '@mui/material';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import ReactMarkdown from 'react-markdown';
import { Note, PRIVATE_ACCESS, PROTECTED_ACCESS, PUBLIC_ACCESS } from '../model/notes';
import './Note.css';
import Debug from 'debug';
import { Close, ContentCopy, Policy, Public, PublicOff, Shield } from '@mui/icons-material';
import { useState } from 'react';

const debug = Debug('yellow-Note');

export interface NoteProps extends Note {
  close: () => void;
  index: number,
  key: string,
  setPrivacy?: (notePrivacy: number) => void
};

function formatDate(epochS: number): string {
  return new Date(epochS * 1000).toLocaleDateString();
}

export function newNoteProps(
  note: Note,
  index: number,
  close: () => void,
  setPrivacy: (notePrivacy: number) => void):
  NoteProps {
  return {
    close: close,
    index: index,
    key: note.id(),
    author: note.author,
    content: note.content,
    creationS: note.creationS,
    id: note.id,
    privacy: note.privacy,
    score: note.score,
    setPrivacy
  }
}

let divIdCounter = 0;

export function NoteDiv(props: NoteProps) {
  debug('render', props);

  const [privateView, setPrivateView] = useState(props.privacy === PRIVATE_ACCESS);
  const [publicView, setPublicView] = useState(props.privacy === PUBLIC_ACCESS);
  const divId = 'NoteDiv-' + (divIdCounter++);

  const copyContent = (e: React.MouseEvent<Element, MouseEvent>) => {
    const div = document.getElementById(divId);
    const el = div?.querySelector('.NoteContent');
    debug('content', el);
    debug('content html', el?.innerHTML);
    const type = 'text/html';
    const blob = new Blob([el?.innerHTML as string], { type });
    navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
  }

  const setPrivacyView = (privacy: number) => {
    switch (privacy) {
      case PRIVATE_ACCESS:
        setPrivateView(true);
        setPublicView(false);
        break;
      case PROTECTED_ACCESS:
        setPrivateView(false);
        setPublicView(false);
        break;
      case PUBLIC_ACCESS:
        setPrivateView(false);
        setPublicView(true);
        break;
      default:
        debug('unknown privacy mode', privacy);
    }
  }

  const updatePrivateView = () => {
    if (props.setPrivacy) {
      const newMode = privateView ? PROTECTED_ACCESS : PRIVATE_ACCESS;
      props.setPrivacy(newMode);
      setPrivacyView(newMode);
    }
  }

  const updatePublicView = () => {
    if (props.setPrivacy) {
      const newMode = publicView ? PROTECTED_ACCESS : PUBLIC_ACCESS;
      props.setPrivacy(newMode);
      setPrivacyView(newMode);
    }
  }

  const publicViewWidget = () => {
    return publicView ?
      <Tooltip title='Remove public'>
        <Public onClick={updatePublicView} />
      </Tooltip> :
      <Tooltip title='Make public'>
        <PublicOff onClick={updatePublicView} />
      </Tooltip>
  }

  const privateViewWidget = () => {
    return privateView ?
      <Tooltip title='Allow sharing'>
        <Shield onClick={updatePrivateView} />
      </Tooltip> :
      <Tooltip title='Make private'>
        <Policy onClick={updatePrivateView} />
      </Tooltip>
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
              ? 'rgba(245,245,245, 0.75)'
              : 'none'
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

            <Box className='RhsHeaderButtonBox'>
              {publicViewWidget()}

              {privateViewWidget()}

              <Tooltip title='Close note'>
                <Close onClick={props.close} />
              </Tooltip>
            </Box>
          </Box>
          <ReactMarkdown className='NoteContent' linkTarget='_blank'>
            {props.content()}
          </ReactMarkdown>
        </Box>
      }
    </Draggable>
  );
}