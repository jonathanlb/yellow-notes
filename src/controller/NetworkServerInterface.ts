import Debug from 'debug';
import { Subject } from 'rxjs';
import { newAuthor, newNote } from '../model/notes';
import { orderNotesByDate, orderNotesByScore, SearchColumn, SearchWorkSpaceModel } from '../model/searchWorkspace';
import { ServerInterface } from './ServerInterface';

const debug = Debug('yellow-controller-network');

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
        id: '-1', // assignment to '' causes rbdnd to freeze note...
    });

}
export class NetworkServerInterface implements ServerInterface {
    noteState: SearchWorkSpaceModel;
    columnsSub: Subject<Array<SearchColumn>>;
    loggedInSub: Subject<boolean>;
    token?: string;

    constructor() {
        this.noteState = new SearchWorkSpaceModel();
        this.columnsSub = new Subject<Array<SearchColumn>>();
        this.loggedInSub = new Subject<boolean>();
    }

    getHeaders = () => {
        return {
            Authorization: `Bearer ${this.token}`
        };
    }

    login = async (username: string, password: string) => {
        debug('login', username);
        const cmd = 'http://localhost:3000/login';

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

        if (!this.token) {
            // XXX TODO: clear credentials, display error
            this.loggedInSub.next(false);
        }
        this.loggedInSub.next(true);
    }

    logout = () => {
        this.token = undefined;
        this.noteState = new SearchWorkSpaceModel();
        this.columnsSub.next([]);
        this.loggedInSub.next(false);
    }

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

    reorderNote = (
        spaceSrcId: number, noteSrcId: number,
        spaceDstId: number, noteDstId: number) => {
        this.noteState.reorderNote(spaceSrcId, noteSrcId, spaceDstId, noteDstId);
        this.updateSubscribers();
    }

    saveNote = async (content: string) => {
        let result: Error | undefined = undefined;
        debug('save', content);
        let cmd = `http://localhost:3000/note/create`;
        const headers = this.getHeaders();
        const body = new URLSearchParams();
        body.append('content', encodeURIComponent(content));

        let resp = await fetch(cmd, { method: 'POST', headers, body })
            .catch(e => { result = e; });
        if (resp?.status === 200) {
            return;
        } else {
            return result || new Error(`${resp?.status} ${resp?.statusText}`);
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
        let cmd = `http://localhost:3000/note/search/${encodeURIComponent(searchTerm)}`;
        const headers = this.getHeaders();
        let resp = await fetch(cmd, { headers })
            .catch(displayError);

        if (resp?.status !== 200) {
            debug('non200', resp);
            displayError({
                message: `status: ${resp?.status} (${resp?.statusText}) type: ${resp?.type || '?'}`
            });
        } else {
            const body = await resp.json() as Array<SearchScore>;
            debug('results', body);
            let notes = await Promise.all(
                body.map(async ss => {
                    const cmd = `http://localhost:3000/note/get/${ss.Id}`;
                    const resp = await fetch(cmd, { headers })
                        .catch(displayError);
                    if (resp?.status === 200) {
                        const obj: any = await resp.json();
                        obj.Id = ss.Id;
                        obj.Score = ss.Score.toFixed(2);
                        return obj;
                    } else {
                        displayError({
                            message: `cannot find id=${ss.Id} status: ${resp?.status} (${resp?.statusText}) type: ${resp?.type || '?'}`
                        });
                    }
                }));
            debug('notes', notes);
            notes = notes.filter(x => x !== undefined);

            await Promise.all( // wait for all note renders to complete to update
                notes.map(async (obj: any) => {
                    let author = this.noteState.getAuthor(obj.Author);
                    if (!author) {
                        author = await this.loadAuthor(obj.Author);
                        this.noteState.addAuthor(author);
                    }
                    const note = newNote({
                        author: author,
                        content: obj.Content,
                        creationS: obj.Created,
                        id: obj.Id,
                        score: obj.Score
                    });
                    this.noteState.addNote(note, spaceIndex);
                }));
        }
        this.updateSubscribers();
    }

    loadAuthor = async (id: string) => {
        const cmd = `http://localhost:3000/user/get/${id}`;
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