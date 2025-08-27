import RegistryContainer from "../Modules/RegistryContainer"
import {Folder, Instance, File} from "@prooheckcp/file-manager"
import loopThruObject from "./../Functions/loopThruObject"
import semver from "semver"
import path from "path"
import ReservedKeywords from "../Constants/ReservedKeywords.json"
import {Crater} from "./Crater"

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export class Project {
    registry: string = "https://github.com/prooheckcp/LunarRegistry";
    cratersPaths: {
        Client: string;
        Server: string;
        Shared: string;
    } = {
        Client: "./Client",
        Server: "./Server",
        Shared: "./Shared"
    };
    craters: Record<string, string> = {};
    packagePath: string = "";

    constructor(init: PartialDeep<Project>, jsonParent: Folder) {
        if (!init.packagePath)
            this.packagePath = jsonParent.Directory

        loopThruObject(this, init)
    }

    async GetFolder(): Promise<Folder>{
        return await Folder.create(this.packagePath)
    }

    async Install(){
        let registry = await RegistryContainer.create(this.registry)
        let packagesFolder: Folder = await Folder.create(path.join(this.packagePath, "Packages"))
        let dictionaryFolders: Record<string, Folder> = {}

        for (const [key, value] of Object.entries(this.cratersPaths)){
            let targetPath = path.join(this.packagePath, value)
            let pointerFolder = await Folder.create(targetPath)
            pointerFolder.SetName(key)

            dictionaryFolders[key] = pointerFolder
        }

        for (const [key, value] of Object.entries(this.craters)){
            const [name, version] = value.split("/");

            if (!semver.valid(version)){
                console.log(`Failed to install the package ${name}, version is invalid`)
                continue
            }

            if (!await registry.getRegistryFolder(name)){
                console.log(`There is not package by the name of ${name}`)
                continue
            }

            let packageVersions: string[] = await registry.getAllPackageVersions(name.toLowerCase())
            let maxVersion: string = semver.maxSatisfying(packageVersions, version) as string
            let folder: Folder | null = await registry.getVersionFolder(name, maxVersion)

            if (!folder){
                console.log(`Could not find any valid version for ${name}`)
                continue
            }

            let clonedPackage: Folder = await folder.Clone() as Folder
            let craterFile: Instance | null = await clonedPackage.FindFirstChild(ReservedKeywords.Crater)

            if (craterFile && craterFile instanceof File){
                let crater = new Crater(await (craterFile as File).ReadObject(), craterFile.Parent)

                for (const [pointerName, targetPath] of Object.entries(crater.pointers)){
                    let targetFolder: Folder | null = await Folder.create(path.join(crater.packagePath, targetPath))

                    if (targetFolder && dictionaryFolders[pointerName]){
                        await targetFolder.SetParent(dictionaryFolders[pointerName])
                    }
                }
            }

            clonedPackage.SetParent(packagesFolder)
            clonedPackage.SetName(key)
        }
    }
}