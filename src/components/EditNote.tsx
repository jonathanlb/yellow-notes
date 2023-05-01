import { useState } from 'react';
import { Close, ContentPaste } from '@mui/icons-material';
import { Box, TextField, Tooltip, Typography } from '@mui/material';
import './EditNote.css';
import Debug from 'debug';
import TurndownService from 'turndown';

const debug = Debug('yellow-Edit');

export interface EditNoteProps {
    cancel: () => void,
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
                // TODO ? convert to MD with Turndown?
                const tds = new TurndownService();
                const blob = await item.getType('text/html');
                setContent(content + tds.turndown(await blob.text()));
            }
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