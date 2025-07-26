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

    constructor(directory: string){
        this._Directory = path.resolve(directory)
        this._Parent = path.dirname(this._Directory)
    }

    // Add SetParent and SetName. Make the Name a dynamic Get as well. 

    get Parent(): Folder{
        return new Folder(this._Parent)
    }

    get Directory(){
        return this._Directory
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

    async GetChildren():Promise<Instance[]>{
        const filesPaths: string[] = await fs.readdir(this.Directory)
        const filesInstances: Instance[] = []

        for (const file of filesPaths){
            let fullFilePath: string = path.join(this.Directory, file)
            let folder: Folder | null = await FileManager.GetFolder(fullFilePath)
            let newInstance = folder || (await FileManager.GetFile(fullFilePath))

            if (newInstance)
                filesInstances.push(newInstance)
        }

        return filesInstances
    }

    async Empty(){
        const filesInstances: Instance[] = await this.GetChildren()

        filesInstances.forEach(instance => {
            await instance.Destroy()
        })
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

    // Add JSON and TOML support for writing. Add writing/read to file API and check if any other is needed
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