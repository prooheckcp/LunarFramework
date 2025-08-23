#!/usr/bin/env node

import path from "path"
import { Command } from "commander"
import {Folder} from "./Classes/FileManager"

const COMMANDS_DIRECTORY: string = path.join(__dirname, "Commands")

const program = new Command();

let packageJson = require(path.join(__dirname, "..", "package.json"))

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)

async function init(){
    let commandsFolder: Folder = new Folder(COMMANDS_DIRECTORY);

    for (const instance of await commandsFolder.GetChildren()){
        const module = require(instance.Directory);
        module.init(program)
    }

    program.parse()
}

init();