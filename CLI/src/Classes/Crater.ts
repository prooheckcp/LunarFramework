import RegistryContainer from "../Modules/RegistryContainer"
import {File, Folder, FileManager} from "@prooheckcp/file-manager"
import path from "path"

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export class Crater {
    name: string = "default-name";
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

        function loopThruObject(object: any, assignableObject: any){
            for (const index of Object.getOwnPropertyNames(object)){
                if (typeof(object[index]) == "object"){
                    if (assignableObject[index])
                        loopThruObject(object[index], assignableObject[index])
                }else if (assignableObject[index])
                    object[index] = assignableObject[index]
            }
        }

        loopThruObject(this, init)
    }

    async GetFolder(): Promise<Folder>{
        return await Folder.create(this.packagePath)
    }

    async Publish(){
        let registry = await RegistryContainer.create(this.registry)
        let packageFolder: Folder = await Folder.create(path.join(registry.getPath(), this.name))

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
