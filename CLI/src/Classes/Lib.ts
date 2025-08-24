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
}
