import Debug from 'debug';
import { Subject } from 'rxjs';
import { Author, DEFAULT_ACCESS, newAuthor, newNote, Note, PRIVATE_ACCESS } from '../model/notes';
import { orderNotesByDate, orderNotesByScore, SearchColumn, SearchWorkSpaceModel } from '../model/searchWorkspace';
import { ServerInterface } from './ServerInterface';
import { config } from '../config';

const debug = Debug('yellow-controller-network');
const NUM_RECENT_NOTES = 6;
const ERRORS_TITLE = 'Errors';
const RECENT_TITLE = 'Recent notes';

type SearchScore = {
    Id: string,
    Score: number,
}
export function createErrorNote(e: any, title: string) {
    const errorContent =
        `# ${title}\n\n**Error:** \`${e.message}\``;
    return newNote({
        author: newAuthor({ id: '', name: 'Notes Server' }),
        content: errorContent,
        creationS: new Date().getTime() / 1000,
        id: (new Date().getTime()*-1).toString(), // assignment to '' causes rbdnd to freeze note...
        privacy: PRIVATE_ACCESS
    });

}
export class NetworkServerInterface implements ServerInterface {
    author?: Author;
    noteState: SearchWorkSpaceModel;
    columnsSub: Subject<Array<SearchColumn>>;
    loggedInSub: Subject<boolean>;
    token?: string;
    userId?: number;

    constructor() {
        this.noteState = new SearchWorkSpaceModel();
        this.columnsSub = new Subject<Array<SearchColumn>>();
        this.loggedInSub = new Subject<boolean>();
    }

    createDefaultView = async () => {
        this.addSpace(RECENT_TITLE);

        const displayError = (e: any) => {
            debug('search error', e);
            const errorNote = createErrorNote(
                e, 'Search Error\n\n**Failed to retrieve recent notes:**');
            this.noteState.addNote(errorNote, 0);
        }

        const cmd = `${config.notesServer}/note/recent/${NUM_RECENT_NOTES}`;
        debug(cmd);
        const headers = this.getHeaders();
        const resp = await fetch(cmd, { headers })
            .catch(displayError);

        if (resp?.status !== 200) {
            debug('recent-non200', resp);
            displayError({
                message: `status: ${resp?.status} (${resp?.statusText})`
            });
            return;
        }

        const body = await resp.json() as Array<string>;
        debug('recent-results', body);
        const ss = body.map(id => { return { Id: id, Score: 1 } });
        const notes = await this.getNotes(ss, displayError);
        await Promise.all(
            notes.map(async (obj: any) => {
                const note = await this.prepareNote(obj);
                this.noteState.addNote(note, 0);
            }));
        this.updateSubscribers();
    }

    getHeaders = () => {
        return {
            Authorization: `Bearer ${this.token}`
        };
    }

    /**
     * Retrieve the note contents from the server.
     *
     * @param noteIds the noteId and searchScore tuples.
     * @param displayError the function to invoke upon error
     * @returns an array of note objects
     */
    getNotes = async (
        noteIds: Array<SearchScore>, displayError: (e: any) => void
    ): Promise<Array<any>> => {
        const headers = this.getHeaders();
        const notes = await Promise.all((noteIds || []).map(async ss => {
            const cmd = `${config.notesServer}/note/get/${ss.Id}`;
            const resp = await fetch(cmd, { headers })
                .catch(displayError);
            if (resp?.status === 200) {
                const obj: any = await resp.json();
                obj.Id = ss.Id.toString();
                obj.Score = ss.Score.toFixed(2);
                return obj;
            } else {
                displayError({
                    message: `cannot find id=${ss.Id} status: ${resp?.status} (${resp?.statusText})`
                });
            }
        }));
        debug('notes', notes);
        return Promise.resolve(notes.filter(x => x !== undefined));
    }

    login = async (username: string, password: string) => {
        debug('login', username);
        const cmd = `${config.notesServer}/login`;

        const login = new URLSearchParams();
        login.append('user', username);
        login.append('pass', password);

        const resp = await fetch(cmd, {
            method: 'POST',
            body: login
        });

        if (resp.status !== 200) {
            // XXX TODO: clear credentials, display error
            this.loggedInSub.next(false);
        }

        const body = await resp.json();
        this.token = body.token;
        this.userId = body.id;

        if (!this.token) {
            // XXX TODO: clear credentials, display error
            this.loggedInSub.next(false);
        } else {
            this.loggedInSub.next(true);
            this.createDefaultView();
            this.author = await this.loadAuthor((this.userId || 0).toString());
        }
    }

    logout = () => {
        this.token = undefined;
        this.userId = undefined;
        this.noteState = new SearchWorkSpaceModel();
        this.columnsSub.next([]);
        this.loggedInSub.next(false);
    }

    addNewNote = (id: string, content: string) => {
        const note = newNote({
            author: this.author || newAuthor({ id: '0', name: 'me' }),
            content: content,
            creationS: new Date().getTime() / 1000,
            id: id,
            score: 1,
            privacy: DEFAULT_ACCESS
        });
        let spaceIdx = this.noteState.getSpaceIndexByTitle(RECENT_TITLE);
        if (spaceIdx < 0) {
            this.addSpace(RECENT_TITLE);
            spaceIdx = 0;
        }
        this.noteState.addNote(note, spaceIdx);
    }

    /**
     * Add a message space.  It's critical here to call updateSubscribers to ensure
     * react/MUI/DND is in a valid state before adding notes to the space.
     *
     * @param spaceTitle
     */
    addSpace = (spaceTitle: string) => {
        this.noteState.addSpace(spaceTitle);
        this.updateSubscribers();
    }

    deleteNote = (spaceIndex: number, noteIndex: number) => {
        this.noteState.deleteNote(spaceIndex, noteIndex);
        this.updateSubscribers();
    }

    deleteSpace = (spaceIndex: number) => {
        this.noteState.deleteSpace(spaceIndex);
        this.updateSubscribers();
    }

    orderNotesByDate = (spaceIndex: number) => {
        orderNotesByDate(this.noteState.columns[spaceIndex]);
        this.updateSubscribers();
    }

    orderNotesByScore = (spaceIndex: number) => {
        orderNotesByScore(this.noteState.columns[spaceIndex]);
        this.updateSubscribers();
    }

    prepareNote = async (obj: any): Promise<Note> => {
        let author = this.noteState.getAuthor(obj.Author);
        if (!author) {
            author = await this.loadAuthor(obj.Author);
            this.noteState.addAuthor(author);
        }
        return newNote({
            author: author,
            content: obj.Content,
            creationS: obj.Created,
            id: obj.Id,
            privacy: obj.Privacy,
            score: obj.Score
        });
    }

    reorderNote = (
        spaceSrcId: number, noteSrcId: number,
        spaceDstId: number, noteDstId: number) => {
        this.noteState.reorderNote(spaceSrcId, noteSrcId, spaceDstId, noteDstId);
        this.updateSubscribers();
    }

    saveNote = async (content: string) => {
        let result: Error | undefined = undefined;
        debug('save', content);
        let cmd = `${config.notesServer}/note/create`;

        const headers = this.getHeaders();
        const body = new URLSearchParams();
        body.append('content', encodeURIComponent(content));

        let resp = await fetch(cmd, { method: 'POST', headers, body })
            .catch(e => { result = e; });
        if (resp?.status === 200) {
            this.addNewNote(await resp?.text() || (-1 * Math.random()).toString(), content);
            return;
        } else {
            return result || new Error(`${resp?.status} ${resp?.statusText}`);
        }
    }

    setNotePrivacy = async (noteId: string, privacy: number) => {
        const displayError = (e: any) => {
            debug('search error', e);
            const errorNote = createErrorNote(
                e, 'Update Privacy Error:');
            let spaceIdx = this.noteState.getSpaceIndexByTitle(ERRORS_TITLE);
            if (spaceIdx < 0) {
                this.addSpace(ERRORS_TITLE);
                spaceIdx = 0;
            }
            this.noteState.addNote(errorNote, spaceIdx);
        }

        const headers = this.getHeaders();
        const cmd = `${config.notesServer}/note/privacy/${noteId}/${privacy}`;
        const resp = await fetch(cmd, { headers })
            .catch(displayError);

        if (resp?.status !== 200) {
            debug('privacy-non200', resp);
            displayError({
                message: `status: ${resp?.status} (${resp?.statusText})`
            });
        }
    }

    search = async (searchTerm: string, spaceIndex: number) => {
        const displayError = (e: any) => {
            debug('search error', e);
            const errorNote = createErrorNote(
                e, `Search Error\n\n**Failed search:** \`${searchTerm}\``);
            this.noteState.addNote(errorNote, spaceIndex);
        }

        debug('search', searchTerm);
        let cmd = `${config.notesServer}/note/search/${encodeURIComponent(searchTerm)}`;
        const headers = this.getHeaders();
        let resp = await fetch(cmd, { headers })
            .catch(displayError);

        if (resp?.status !== 200) {
            debug('search-non200', resp);
            displayError({
                message: `status: ${resp?.status} (${resp?.statusText})`
            });
        } else {
            const body = await resp.json() as Array<SearchScore>;
            debug('search-results', body);
            let notes = await this.getNotes(body, displayError);

            await Promise.all( // wait for all note renders to complete to update
                notes.map(async (obj: any) => {
                    const note = await this.prepareNote(obj);
                    this.noteState.addNote(note, spaceIndex);
                }));
        }
        this.updateSubscribers();
    }

    loadAuthor = async (id: string) => {
        const cmd = `${config.notesServer}/user/get/${id}`;
        const headers = this.getHeaders();
        debug('loadAuthor', cmd);
        const resp = await fetch(cmd, { headers });
        const author = await resp.json();
        author.name = author.Name;
        author.id = author.Id;
        debug('loaded author', author);
        return newAuthor(author);
    }

    getSpaces = () => {
        return this.columnsSub;
    }

    getLoggedIn = () => {
        return this.loggedInSub;
    }

    updateSubscribers = () => {
        this.columnsSub.next(this.noteState.columns.slice());
    }
}