import { mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import envPaths from 'env-paths';

// src/Modules/RegistryContainer.ts

export class RegistryContainer {
    // In-memory lock map to avoid concurrent clone/pull on same repo
    private static locks: Map<string, Promise<string>> = new Map()

    // Root directory where registries are stored (hidden / system data location)
    private static getBaseDir(): string {
        const codeDbPath = envPaths('code-db').data
        const base = path.join(codeDbPath, 'registries')

        return base
    }

    // Derive deterministic folder name from URL (safe + short)
    private static folderNameFromUrl(registryUrl: string): string {
        let basePart: string;
        try {
            const u = new URL(registryUrl);
            const parts = u.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                // owner/repo
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

    static async repoExists(registryUrl: string): Promise<boolean> {
        const dir = this.getRepoDir(registryUrl);
        if (!existsSync(dir)) return false;
        const gitDir = path.join(dir, '.git');
        return existsSync(gitDir);
    }

    static async cloneRegistry(registryUrl: string): Promise<string> {
        const targetDir = this.getRepoDir(registryUrl);
        if (await this.repoExists(registryUrl)) return targetDir;
        await this.ensureBaseDir();
        await this.runGit(['clone', '--depth=1', registryUrl, targetDir]);
        return targetDir;
    }

    static async updateRegistry(registryUrl: string): Promise<string> {
        const dir = this.getRepoDir(registryUrl);
        if (!(await this.repoExists(registryUrl))) return dir;
        // Fetch & pull
        await this.runGit(['-C', dir, 'fetch', '--all', '--prune']);
        // Fast-forward only to avoid merge commits
        try {
            await this.runGit(['-C', dir, 'pull', '--ff-only']);
        } catch {
            // Fallback to normal pull if ff-only fails
            await this.runGit(['-C', dir, 'pull']);
        }
        return dir;
    }

    // Ensure repo is present and up to date, returns absolute directory
    static async ensureAndGet(registryUrl: string): Promise<string> {
        const key = this.getRepoDir(registryUrl);
        if (!this.locks.has(key)) {
            const task = (async () => {
                if (await this.repoExists(registryUrl)) {
                    return this.updateRegistry(registryUrl);
                } else {
                    return this.cloneRegistry(registryUrl);
                }
            })()
                .finally(() => {
                    // Release lock after completion (slight delay to batch quick successive calls)
                    setTimeout(() => this.locks.delete(key), 50);
                });
            this.locks.set(key, task);
        }
        return this.locks.get(key)!;
    }

    // Internal: ensure base dir exists
    private static async ensureBaseDir(): Promise<void> {
        const base = this.getBaseDir();
        try {
            await stat(base);
        } catch {
            await mkdir(base, { recursive: true });
        }
    }

    private static runGit(args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn('git', args, { stdio: 'inherit' });
            child.on('error', reject);
            child.on('exit', code => {
                if (code === 0) resolve();
                else reject(new Error(`git ${args.join(' ')} failed with code ${code}`));
            });
        });
    }
}

export default RegistryContainer;