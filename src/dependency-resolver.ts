import { PackageVersion } from "./package-version";
import { NpmInfoProvider, PackageDependencies } from "./npm-info-provider";

export interface ResolvedDependencies {
    rootPackages: PackageVersion[];
    flattenedVersions: PackageDependencies[];
    dependencies: PackageDependencies[];
    missingPackages: PackageVersion[];
}

export class DependencyResolver {
    protected readonly npmInfoProvider = new NpmInfoProvider();

    async resolveDependencies(packageVersions: PackageVersion[]): Promise<ResolvedDependencies> {
        const todo = new Map<string, PackageVersion>();
        packageVersions.forEach(v => this.addToDo(todo, v));

        const allFlatVersions: PackageDependencies[] = [];
        const allDeps = new Map<string,Map<string,PackageDependencies>>();
        const missingPackages: PackageVersion[] = [];

        let counter = 0;
        let it = todo.entries().next();
        while (!it.done) {
            counter++;
            const entry = it.value;
            const pkgVersion = entry[1];
            console.log(`Processing ${pkgVersion.toString()}... (${counter}/${todo.size})`)

            try {
                const flatVersions = await this.npmInfoProvider.resolveToFlatVersions(pkgVersion);
                allFlatVersions.push({ package: pkgVersion, dependencies: flatVersions });

                const packageDeps = this.getPkgDeps(allDeps, pkgVersion.name);

                for (const fixVersion of flatVersions) {
                    if (packageDeps.has(fixVersion.version.raw)) {
                        // This exact version has already been resolved. next!
                        continue;
                    }

                    // For this version, store all dependencies...
                    const deps = await this.npmInfoProvider.getDependenciesFor(fixVersion);
                    packageDeps.set(fixVersion.version.raw, deps);

                    // ...and take a note to resolve it's dependencies, too! (if not already done)
                    deps.dependencies.forEach(dep => this.addToDo(todo, dep));
                }
            } catch (err) {
                console.log(`Could not find package ` + pkgVersion.name + '. Ignoring it.');
                missingPackages.push(pkgVersion);
            }

            // Finally, remove current pkgVersion
            todo.delete(entry[0]);
            it = todo.entries().next();
        }

        console.log('Finished resolving.');

        const dependencies: PackageDependencies[] = [];
        allDeps.forEach(m => m.forEach(e => dependencies.push(e)));
        return {
            rootPackages: packageVersions,
            flattenedVersions: allFlatVersions,
            dependencies,
            missingPackages
        };
    }

    protected addToDo(todo: Map<string, PackageVersion>, pkg: PackageVersion) {
        if (!todo.has(pkg.toString())) {
            todo.set(pkg.toString(), pkg);
            // pre-fetch package infos for later
            this.npmInfoProvider.getInfo(pkg.name).catch(err => {});
        }
    }

    protected getPkgDeps(allDeps: Map<string,Map<string,PackageDependencies>>, name: string): Map<string, PackageDependencies> {
        let packageDeps = allDeps.get(name);
        if (!packageDeps) {
            packageDeps = new Map<string, PackageDependencies>();
            allDeps.set(name, packageDeps);
        }
        return packageDeps;
    }
}

