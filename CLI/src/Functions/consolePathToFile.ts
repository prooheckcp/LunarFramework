import {Folder, File, FileManager} from "@prooheckcp/file-manager"

export async function consolePathToFile(path: string, name: string): Promise<File | null> {
    let file: File | null = await FileManager.GetFile(path)
    let folder: Folder | null = await FileManager.GetFolder(path)

    if (file) {
        if (file.Name == name)
            return file

        return null
    }

    if (folder) {
        return await folder.FindFirstFile(name)
    }

    return null
}