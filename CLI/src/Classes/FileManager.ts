import fs from "fs/promises"
import path, { resolve } from "path"
import { rename, readdir, rm } from 'fs/promises'
import toml from "@iarna/toml"

// Types
import type { Stats } from 'fs';

export async function getNestedFiles(directory: string, extension?: string): Promise<string[]>{
    let filesArray: string[] = []

    try {
        const files = await fs.readdir(directory)

        for (const file of files){
            let nestedDirectory: string = path.join(directory, file)
            let pathStat: Stats = await fs.stat(nestedDirectory)

            if (pathStat.isDirectory()){
                filesArray.push(nestedDirectory)
                filesArray = filesArray.concat(await getNestedFiles(nestedDirectory, extension))
            }
            else if(pathStat.isFile()){                
                if (extension == null)
                    filesArray.push(nestedDirectory)
                else{
                    let extName: string = path.extname(nestedDirectory)

                    if (extName == extension || extName == `.${extension}`)
                        filesArray.push(nestedDirectory)
                }
            }           
        }
    }

    catch(err){
        console.log(err)
    }

    return filesArray
}

class Instance {
    // Private
    private _Directory: string = ""
    private _Parent: string

    constructor(directory: string){
        this._Directory = path.resolve(directory)
        this._Parent = path.dirname(this._Directory)
    }

    get Parent(): Folder{
        return new Folder(this._Parent)
    }

    get Directory(){
        return this._Directory
    }

    get Name(){
        return path.basename(this._Directory)
    }

    async SetName(name: string){
        const newCompletePath = path.join(this._Parent, name)

        await rename(this._Directory, newCompletePath)

        this._Directory = newCompletePath
    }

    async SetParent(newDirectory: string | Folder){
        let resolvedPath: string = ""

        if (typeof(newDirectory) == "string"){
            resolvedPath = newDirectory

            if (!await FileManager.GetFolder(resolvedPath))
                throw new Error(`There's no directory under ${resolvedPath}`);

        }else if(newDirectory instanceof Folder)
            resolvedPath = newDirectory.Directory
        else
            throw new Error("Invalid parent directory type.")
        

        let newCompletePath: string = path.join(path.resolve(resolvedPath), this.Name)
        await rename(this._Directory, newCompletePath)

        this._Directory = newCompletePath
        this._Parent = path.dirname(newCompletePath)
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

    async GetChildren(extension?: string):Promise<Instance[]>{
        const filesPaths: string[] = await fs.readdir(this.Directory)
        const filesInstances: Instance[] = []

        for (const file of filesPaths){
            let fullFilePath: string = path.join(this.Directory, file)
            let folder: Folder | null = await FileManager.GetFolder(fullFilePath)
            let newInstance = folder || (await FileManager.GetFile(fullFilePath))
            
            if (newInstance == null)
                continue

            if (extension == null){
                filesInstances.push(newInstance)
                continue
            }

            let extName: string = path.extname(fullFilePath)

            if (extName == extension || extName == `.${extension}`)
                filesInstances.push(newInstance)
        }

        return filesInstances
    }

    async GetDescendants(extension?: string):Promise<Instance[]>{
        const filesPaths: string[] = await getNestedFiles(this.Directory, extension)
        const filesInstances: Instance[] = []

        for (const file of filesPaths){
            let fullFilePath: string = file//path.join(this.Directory, file)
            let folder: Folder | null = await FileManager.GetFolder(fullFilePath)
            let newInstance = folder || (await FileManager.GetFile(fullFilePath))

            if (newInstance)
                filesInstances.push(newInstance)
        }

        return filesInstances
    }

    async FindFirstFolder(folderName: string): Promise<Folder | null>{
        return await FileManager.GetFolder(path.join(this.Directory, folderName))
    }

    async FindFirstFile(fileName: string): Promise<File | null>{
        return await FileManager.GetFile(path.join(this.Directory, fileName))
    }

    async Empty(){
        const filesInstances: Instance[] = await this.GetChildren()

        for (let i = 0; i < filesInstances.length; i++)
            await filesInstances[i].Destroy()
    }

    async MoveChildren(newDirectory: string | Folder){
        const children: Instance[] = await this.GetChildren()

        for (let i = 0; i < children.length; i++)
            await children[i].SetParent(newDirectory)
    }
}

export class File extends Instance {
    get Extension(){
        let baseName: string = path.basename(this.Directory)
        let dotIndex: number = -1
        
        for (let i = baseName.length; i > 0; i--){
            if (baseName[i] == "."){
                dotIndex = i
                break
            }
        }

        if (dotIndex < 0)
            return ""

        return baseName.substring(dotIndex + 1)
    }

    static async create(path: string, content?: string){
        let file: File | null = await FileManager.GetFile(path)

        if (!file){
            await fs.writeFile(path, content || "")
            file = new File(path)
        }

        return file
    }

    async Read(): Promise<string> {
        let fileData: string = await fs.readFile(this.Directory, 'utf-8')
        
        return fileData
    }

    async Write(newContent: string) {
        await fs.writeFile(this.Directory, newContent)
    }

    async WriteObject<T>(object: T) {
        const extensionName: string = path.extname(this.Directory)
        
        if (extensionName == ".toml")
            return this.Write(toml.stringify(object as toml.JsonMap))

        await this.Write(JSON.stringify(object))
    }

    async ReadObject<T>(): Promise<T> {
        const extensionName: string = path.extname(this.Directory)
        let data: string = await this.Read()

        if (extensionName == ".toml")
            return toml.parse(data) as T

        return JSON.parse(data) as T
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