import { Observable } from 'rxjs';
import { SearchColumn } from '../model/searchWorkspace';

export interface ServerInterface {
    login: (username: string, password: string) => void,
    logout: () => void,

    addSpace: (spaceTitle: string) => void,
    deleteNote: (spaceIndex: number, noteIndex: number) => void,
    deleteSpace: (spaceIndex: number) => void,
    reorderNote: (spaceSrcId: number, noteSrcId: number,
        spaceDstId: number, noteDstId: number) => void,
    saveNote: (content: string) => Promise<Error|void>,
    search: (searchTerm: string, spaceIndex: number) => void,
    getSpaces: () => Observable<Array<SearchColumn>>,
    getLoggedIn: () => Observable<Boolean>,
}