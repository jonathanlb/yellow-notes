import Debug from 'debug';
import { Observable, Subject } from 'rxjs';
import { Author, newAuthor, newNote } from '../model/notes';
import { SearchColumn, SearchWorkSpaceModel } from '../model/searchWorkspace';

const debug = Debug('yellow-controller');

export interface ServerInterface {
    login: (username: string, password: string) => void,
    logout: () => void,

    addSpace: (spaceTitle: string) => number,
    deleteNote: (spaceIndex: number, noteIndex: number) => void,
    deleteSpace: (spaceIndex: number) => void,
    reorderNote: (spaceSrcId: number, noteSrcId: number,
        spaceDstId: number, noteDstId: number) => void,

    getSpaces: () => Observable<Array<SearchColumn>>,
    getLoggedIn: () => Observable<Boolean>,
}

export class DemoServerInterface implements ServerInterface {
    noteState: SearchWorkSpaceModel;
    columnsSub: Subject<Array<SearchColumn>>;
    loggedInSub: Subject<boolean>;

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
                id: '11',
                title: 'TODO'
            }),
            0);
        this.noteState.addNote(
            newNote({
                author: this.noteState.getAuthor('1') as Author,
                content: '💩',
                creationS: 1678809892,
                id: '12',
                title: 'Remember Something'
            }),
            0);

        this.updateSubscribers();
        this.loggedInSub.next(true);
    }

    addSpace = (spaceTitle: string): number => {
        const spaceIdx = this.noteState.addSpace(spaceTitle);
        this.updateSubscribers();
        return spaceIdx;
    }

    deleteNote = (spaceIndex: number, noteIndex: number) => {
        this.noteState.deleteNote(spaceIndex, noteIndex);
        this.updateSubscribers();
    }

    deleteSpace = (spaceIndex: number) => {
        this.noteState.deleteSpace(spaceIndex);
        this.updateSubscribers();
    }

    reorderNote = (spaceSrcId: number, noteSrcId: number,
        spaceDstId: number, noteDstId: number) => {
        this.noteState.reorderNote(spaceSrcId, noteSrcId, spaceDstId, noteDstId);
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

/*
export class NetworkServerInterface implements ServerInterface {
    addSpace: (spaceTitle: string) => void;
    deleteNote: (spaceIndex: number, noteIndex: number) => void;
    deleteSpace: (spaceIndex: number) => void;
    reorderNote: (spaceSrcId: number, noteSrcId: number, spaceDstId: number, noteDstId: number) => void;
    login(token: string) {

    }

    logout() {

    }
}*/