#!/usr/bin/env node

import path from "path"
import { Command } from "commander"
import {getNestedFiles} from "./Functions/fileUtil"
import {Folder, File} from "./Classes/FileManager"

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

    let exampleFolder = await Folder.create(path.join("./", "ExampleFolder"))
    let folder = await exampleFolder.FindFirstFolder("Folder1")
    let folder2 = await exampleFolder.FindFirstFolder("Folder2")
    
    let c = await folder2?.GetDescendants()
    console.log(c)
}

init();