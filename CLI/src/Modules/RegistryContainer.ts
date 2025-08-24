import { mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import envPaths from 'env-paths';
import {Folder, FileManager} from "@prooheckcp/file-manager"
import semver from "semver"

export class RegistryContainer {
    private repoPath: string;
    private registryUrl: string;

    // In-memory lock map to avoid concurrent operations on same repo
    private static locks: Map<string, Promise<RegistryContainer>> = new Map();

    private constructor(registryUrl: string, repoPath: string) {
        this.registryUrl = registryUrl;
        this.repoPath = repoPath;
    }

    // Factory method to create and initialize container
    static async create(registryUrl: string): Promise<RegistryContainer> {
        const repoPath = this.getRepoDir(registryUrl);
        
        if (!this.locks.has(repoPath)) {
            const task = (async () => {
                await this.ensureBaseDir();

                if (await this.repoExists(registryUrl)) {
                    // Repo already exists → update it
                    const container = new RegistryContainer(registryUrl, repoPath);
                    await container.fetch();
                    await container.pull();
                    return container;
                } else {
                    // Repo doesn’t exist → clone it
                    const container = new RegistryContainer(registryUrl, repoPath);
                    await container.clone();
                    return container;
                }
            })()
                .finally(() => {
                    setTimeout(() => this.locks.delete(repoPath), 50);
                });
            this.locks.set(repoPath, task);
        }
        return this.locks.get(repoPath)!;
    }

    async getRegistryFolder(packageName: string): Promise<Folder | null>{
        let repoFolder: Folder | null = await FileManager.GetFolder(this.repoPath)

        if (repoFolder)
            return await repoFolder.FindFirstFolder(packageName.toLowerCase())

        return null
    }

    async getVersionFolder(packageName: string, version: string): Promise<Folder | null>{
        let packageFolder = await this.getRegistryFolder(packageName)

        if (packageFolder)
            return await packageFolder.FindFirstFolder(version)

        return null
    }

    async getAllPackageVersions(packageName: string): Promise<string[]> {
        let registryFolder: Folder | null = await this.getRegistryFolder(packageName)

        if (!registryFolder)
            return []

        let versions: string[] = []

        for (let child of await registryFolder.GetChildren()) {
            if (child instanceof Folder) {
                let version = child.Name
                if (semver.valid(version))
                versions.push(version)                
            }
        }

        return versions
    }

    // Git operations
    async clone(): Promise<void> {
        const parentDir = path.dirname(this.repoPath);
        await this.runGit(['clone', '--depth=1', this.registryUrl, this.repoPath], parentDir);
    }


    async fetchAndPull(): Promise<void> {
        await this.fetch();
        await this.pull();
    }

    async commitAndPush(message: string = "Update from RegistryContainer"): Promise<void> {
        await this.commit(message);
        await this.push();
    }

    async pull(): Promise<void> {
        try {
            await this.runGit(['pull', '--ff-only']);
        } catch {
            await this.runGit(['pull']);
        }
    }

    async fetch(): Promise<void> {
        await this.runGit(['fetch', '--all', '--prune']);
    }

    async commit(message: string = "Update from RegistryContainer"): Promise<void> {
        await this.runGit(['add', '.']);
        try {
            await this.runGit(['commit', '-m', message]);
        } catch (err: any) {
            if (!/nothing to commit/.test(err.message)) throw err;
        }
    }

    async push(): Promise<void> {
        await this.runGit(['push']);
    }

    // Getter for repo path
    getPath(): string {
        return this.repoPath;
    }

    // Static utility methods
    private static getBaseDir(): string {
        const codeDbPath = envPaths('code-db').data;
        return path.join(codeDbPath, 'registries');
    }

    private static folderNameFromUrl(registryUrl: string): string {
        let basePart: string;
        try {
            const u = new URL(registryUrl);
            const parts = u.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                basePart = parts.slice(-2).join('-');
            } else {
                basePart = parts.join('-') || 'repo';
            }
        } catch {
            basePart = 'repo';
        }
        basePart = basePart.replace(/\.git$/i, '');
        const hash = crypto.createHash('sha1').update(registryUrl).digest('hex').slice(0, 10);
        return `${basePart}-${hash}`;
    }

    private static getRepoDir(registryUrl: string): string {
        return path.join(this.getBaseDir(), this.folderNameFromUrl(registryUrl));
    }

    private static async repoExists(registryUrl: string): Promise<boolean> {
        const dir = this.getRepoDir(registryUrl);
        if (!existsSync(dir)) return false;
        const gitDir = path.join(dir, '.git');
        return existsSync(gitDir);
    }

    private static async ensureBaseDir(): Promise<void> {
        const base = this.getBaseDir();
        try {
            await stat(base);
        } catch {
            await mkdir(base, { recursive: true });
        }
    }

    private runGit(args: string[], cwd: string = this.repoPath): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn('git', args, { stdio: 'inherit', cwd });
            child.on('error', reject);
            child.on('exit', code => {
                if (code === 0) resolve();
                else reject(new Error(`git ${args.join(' ')} failed with code ${code}`));
            });
        });
    }
}

export default RegistryContainer;