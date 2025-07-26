import fs from "fs/promises"
import path from "path"
import { rename, readdir, rm } from 'fs/promises'

// Types
import type { Stats } from 'fs';

class Instance {
    // Public
    public Name: string = "";

    // Private
    private _Directory: string = ""
    private _Parent: string

    constructor(public directory: string){
        // If the directory does not exist then create one
        this._Directory = path.resolve(directory)
        this._Parent = path.dirname(this._Directory)
    }

    get Parent(): Folder{
        return new Folder(this._Parent)
    }

    get Directory(){
        return this._Directory
    }

    set Parent(newDirectory: string){
        this._Parent = newDirectory
    }

    async Destroy(){
        await rm(this.Directory, { recursive: true, force: true });
    }
}

export class Folder extends Instance {
    static async create(path: string): Promise<Folder> {
        let folder: Folder | null = await FileManager.GetFolder(path)

        if (!folder){
            await fs.mkdir(path)
            folder = new Folder(path)
        }

        return folder
    }

    GetChildren(){
        
    }

    Empty(){

    }
}

export class File extends Instance {
    static async create(path: string, content?: string){
        let file: File | null = await FileManager.GetFile(path)

        if (!file){
            await fs.writeFile(path, content || "")
            file = new File(path)
        }

        return file
    }
}

export class FileManager {
    static async GetFolder(directory: string): Promise<Folder | null> {
        const stats: Stats | null = await FileManager.GetStat(directory)
        
        if (!stats || !stats.isDirectory())
            return null

        return new Folder(directory)
    }

    static async GetFile(directory: string): Promise<File | null> {
        const stats: Stats | null = await FileManager.GetStat(directory)
        
        if (!stats || !stats.isFile())
            return null

        return new File(directory)
    }

    static async PathExists(directory: string): Promise<boolean> {
        try {
            await fs.stat(directory)

            return true
        }
        catch {
            return false
        }
    }

    static async GetStat(directory: string): Promise<Stats | null>{
        if (await FileManager.PathExists(directory))
            return await fs.stat(directory)

        return null
    }
}