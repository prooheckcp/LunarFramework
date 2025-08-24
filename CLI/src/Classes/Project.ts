import RegistryContainer from "../Modules/RegistryContainer"
import {Folder} from "@prooheckcp/file-manager"
import loopThruObject from "./../Functions/loopThruObject"
import path from "path"
import semver from "semver"

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export class Crater {
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
    }
    version: string = "0.0.1";
    registry: string = "default-registry";
    packagePath: string = "";
    dependencies: Record<string, any> = {};
    pointers: {
        client: string;
        server: string;
        shared: string;
    } = {
        client: "default-client",
        server: "default-server",
        shared: "default-shared",
    };

    constructor(init: PartialDeep<Crater>, jsonParent: Folder) {
        if (!init.packagePath)
            this.packagePath = jsonParent.Directory

        loopThruObject(this, init)

        this.name = this.name.toLowerCase()
        let cleanedVersion = semver.valid(this.version)

        if (!cleanedVersion)
            throw new Error(`The version "${this.version}" is not valid!`)

        this.version = cleanedVersion
    }

    async GetFolder(): Promise<Folder>{
        return await Folder.create(this.packagePath)
    }

    async Publish(){
        let registry = await RegistryContainer.create(this.registry)
        let packageFolder: Folder = await Folder.create(path.join(registry.getPath(), this.name))

        //let packageVersions = await registry.getAllPackageVersions(this.name)
        //console.log(packageVersions)
        //let maxVersion: string = semver.maxSatisfying(packageVersions, this.version) as string
        //console.log(maxVersion)


        if (await packageFolder.FindFirstFolder(this.version)){
            console.log(`Couldn't publish this package! There's already a version ${this.version} for ${this.name}`)
            return
        }

        let packageClone: Folder = await (await this.GetFolder()).Clone() as Folder
        await packageClone.SetParent(packageFolder)
        await packageClone.SetName(this.version)
        await registry.commitAndPush(`Upload version ${this.version} for ${this.name}`)         
    }
}
