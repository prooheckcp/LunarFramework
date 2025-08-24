import RegistryContainer from "../Modules/RegistryContainer"
import {Folder} from "@prooheckcp/file-manager"
import loopThruObject from "./../Functions/loopThruObject"
import semver from "semver"
import path from "path"

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

        for (const [key, value] of Object.entries(this.craters)){
            const [name, version] = value.split("/");

           // console.log(`Key: ${key}, Value: ${value} Name: ${name}, Version: ${version}`)

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
            clonedPackage.SetParent(packagesFolder)
            clonedPackage.SetName(key)
        }
    }
}