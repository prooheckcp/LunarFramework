import fs from "fs/promises"
import path from "path"
import { rename, readdir, rm } from 'fs/promises'

// Types
import type { Stats } from 'fs';

class Instance {
    // Public
    Directory: string = ""
    Name: string = "";
    // Private
    _Parent: string

    constructor(public directory: string){
        // If the directory does not exist then create one
        this.Directory = directory

        this._Parent = path.dirname(directory)
    }

    get Parent(){
        return this._Parent
    }

    set Parent(newDirectory: string){
        this._Parent = newDirectory
    }

    GetChildren(){

    }

    Empty(){

    }

    Destroy(){

    }
}

export class Folder extends Instance {
    static async create(path: string): Promise<Folder> {
        let folder: Folder | null = await FileManager.GetFolder(path)

        console.log(`Path: ${path}`)
        console.log(`Folder: ${folder}`)

        if (!folder){
            console.log("Made a new folder!")
            await fs.mkdir(path)
            folder = new Folder(path)
        }

        return folder
    }
}

export class File extends Instance {
    static async create(path: string){

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