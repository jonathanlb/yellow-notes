import Debug from 'debug';
import { Subject } from 'rxjs';
import { Author, DEFAULT_ACCESS, newAuthor, newNote } from '../model/notes';
import { orderNotesByDate, orderNotesByScore, SearchColumn, SearchWorkSpaceModel } from '../model/searchWorkspace';
import { ServerInterface } from './ServerInterface';

const debug = Debug('yellow-controller-demo');

export class DemoServerInterface implements ServerInterface {
    noteState: SearchWorkSpaceModel;
    columnsSub: Subject<Array<SearchColumn>>;
    loggedInSub: Subject<boolean>;

    dummyNoteId: number;

    constructor() {
        this.noteState = new SearchWorkSpaceModel();
        this.columnsSub = new Subject<Array<SearchColumn>>();
        this.loggedInSub = new Subject<boolean>();

        // populate with demo data
        this.noteState.addAuthor(newAuthor({ id: '1', name: 'Jonathan' }));
        this.noteState.addSpace('TODOs');
        this.noteState.addNote(
            newNote({
                author: this.noteState.getAuthor('1') as Author,
                content: '- Do something new\n- It\'s \u03C0 Day',
                creationS: 1678808892,
                privacy: DEFAULT_ACCESS,
                id: '11'
            }),
            0);
        this.noteState.addNote(
            newNote({
                author: this.noteState.getAuthor('1') as Author,
                content: '💩',
                creationS: 1678809892,
                privacy: DEFAULT_ACCESS,
                id: '12'
            }),
            0);
        this.dummyNoteId = 13;
        this.updateSubscribers();
        this.loggedInSub.next(true);
    }

    addSpace = (spaceTitle: string): void => {
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
        this.noteState.addNote(
            newNote({
                author: this.noteState.getAuthor('1') as Author,
                content: content,
                creationS: new Date().getTime(),
                privacy: DEFAULT_ACCESS,
                id: (this.dummyNoteId++).toString()
            }),
            0);
    }

    setNotePrivacy = (_noteId: string, _privacy: number) => {
        // dummy
    }

    search = (searchTerm: string, spaceIndex: number) => {
        this.noteState.addNote(
            newNote({
                author: this.noteState.getAuthor('1') as Author,
                content: searchTerm,
                creationS: new Date().getTime(),
                privacy: DEFAULT_ACCESS,
                id: (this.dummyNoteId++).toString()
            }),
            spaceIndex);
        this.updateSubscribers();
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

    login = (username: string, password: string) => {
        debug('login', username, password);
        this.loggedInSub.next(true);
    }

    logout = () => {
        this.loggedInSub.next(false);
    }
}