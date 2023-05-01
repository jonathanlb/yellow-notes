import { useState } from 'react';
import { Close, ContentPaste, Save } from '@mui/icons-material';
import { Box, TextField, Tooltip, Typography } from '@mui/material';
import './EditNote.css';
import Debug from 'debug';
import TurndownService from 'turndown';
import { createErrorNote } from '../controller/NetworkServerInterface';

const debug = Debug('yellow-Edit');

export interface EditNoteProps {
    cancel: () => void,
    save: (content: string) => Promise<Error|void>,
};

export function EditNoteDiv(props: EditNoteProps) {
    const [ content, setContent ] = useState('');
    const paste = async () => {
        const fromClip = await navigator.clipboard.read();
        for (const item of fromClip) {
            debug('paste', item);
            if (item.types.includes('text/plain')) {
                const blob = await item.getType('text/plain');
                setContent(content + await blob.text());
            } else if (item.types.includes('text/html')) {
                const tds = new TurndownService();
                const blob = await item.getType('text/html');
                setContent(content + tds.turndown(await blob.text()));
            }
        }
    }

    const save = async () => {
        const e = await props.save(content);
        if (e) {
            const errorNote = createErrorNote(e, 'Cannot Save:');
            setContent(`${errorNote.content()}\n\n${content}`);
        } else {
            props.cancel();
        }
    }

    return (
        <Box className='EditNoteDiv'>
            <Box className='EditNoteHeader'>
                <Typography variant='h3'>
                    New note...
                </Typography>
                <Tooltip title='Paste from clipboard'>
                    <ContentPaste 
                        onClick={paste} />
                </Tooltip>
                <Tooltip title='Save'>
                    <Save
                        onClick={save} />
                </Tooltip>
                <Tooltip title='Close note'>
                    <Close
                        sx={{ marginRight: 0, marginLeft: 'auto' }}
                        onClick={props.cancel}
                    />
                </Tooltip>
            </Box>
            <TextField multiline fullWidth
                value={content}
                onChange={(e) => setContent(e.target.value)} />
        </Box>
    );
}