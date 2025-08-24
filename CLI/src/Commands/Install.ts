import {File} from "@prooheckcp/file-manager"
import ReservedKeywords from "../Constants/ReservedKeywords.json"
import { consolePathToFile } from "../Functions/consolePathToFile"
import { Project } from "../Classes/Project"

const init = (program: any)=> {
    program.command("install")
    .description('Initiates a git project and extracts it into the current folder')
    .argument("[path]", 'string with the path to the directory')
    .option('-p, --path <string>', 'custom path')
    .action(async (pathArg: string, options: {[key: string]: any}) => {
        let targetPath: string = pathArg || options.path || process.cwd()
        let projectFile: File | null = await consolePathToFile(targetPath, ReservedKeywords.Project)

        if (!projectFile){
            console.error(`Could not find "${ReservedKeywords.Project}" in the target folder.`)
            return 
        }

        let object: Project = new Project(await projectFile.ReadObject(), projectFile.Parent)
        object.Install()
    });
}

export {init}