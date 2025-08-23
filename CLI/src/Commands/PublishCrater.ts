import RegistryContainer from "../Modules/RegistryContainer"
import {Folder, File, FileManager} from "@prooheckcp/file-manager"
import ReservedKeywords from "../Constants/ReservedKeywords.json"
import { consolePathToFile } from "../Functions/consolePathToFile"
import path from "path"
import { Crater } from "../Classes/Crater"

const init = (program: any)=> {
    program.command("publish-crater")
    .description('Initiates a git project and extracts it into the current folder')
    .argument("[path]", 'string with the path to the directory')
    .option('-p, --path <string>', 'custom path')
    .action(async (pathArg: string, options: {[key: string]: any}) => {
        let targetPath: string = pathArg || options.path || process.cwd()
        let craterFile: File | null = await consolePathToFile(targetPath, ReservedKeywords.Crater)

        if (!craterFile){
            console.error(`Could not find "${ReservedKeywords.Crater}" in the target folder.`)
            return 
        }
           
        let object: Crater = new Crater(await craterFile.ReadObject())

        console.log("Our object:")
        console.log(object)
    });
}

export {init}