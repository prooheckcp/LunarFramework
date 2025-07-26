#!/usr/bin/env node

import path from "path"
import { Command } from "commander"
import {getNestedFiles} from "./Functions/fileUtil"
import {Folder} from "./Classes/FileManager"

const COMMANDS_DIRECTORY: string = path.join(__dirname, "Commands")

const program = new Command();

let packageJson = require(path.join(__dirname, "..", "package.json"))

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)

async function init(){
    for (const filePath of await getNestedFiles(COMMANDS_DIRECTORY)){
        const module = require(filePath);
        module.init(program)
    }

    let folder = Folder.create(path.join("./", "Amogus"))
    // program.parse();
}

init();