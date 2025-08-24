import RegistryContainer from "../Modules/RegistryContainer"
import {Folder} from "@prooheckcp/file-manager"
import loopThruObject from "./../Functions/loopThruObject"
import path from "path"
import semver from "semver"

type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export class Lib {
        author: string = "prooheckcp";
        name: string = "TestExample";
        description: string = "A cleaner to handle connections and or object cleaning in your project";
        version: string = "0.0.1";
        license: string = "MIT";
        exclude: string[] = ["**"];
        include: string[] = ["**"];
        repository: string = "";
        dependencies: any[] = [];
        packagePath: string = "";

        constructor(init: PartialDeep<Lib>, jsonParent: Folder) {
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
