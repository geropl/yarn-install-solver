import * as RegClient from 'npm-registry-client';
import { PackageVersion, FixPackageVersion } from './package-version';
import { SemVer } from 'semver';

export interface PackageDependencies {
    package: PackageVersion;
    dependencies: PackageVersion[];
}

export class NpmInfoProvider {

    protected readonly client = new RegClient({});
    protected readonly infoCache = new Map<string, Promise<RegClient.GetResult>>();

    protected readonly params: RegClient.GetParams = {
        timeout: 1000
    };

    async resolveToFlatVersions(packageVersion: PackageVersion): Promise<FixPackageVersion[]> {
        const info = await this.getInfo(packageVersion.name);
        const flatVersions: FixPackageVersion[] = [];
        for (const version in info.versions) {
            if (packageVersion.contains(version)) {
                flatVersions.push(new FixPackageVersion(packageVersion.name, new SemVer(version)));
            }
        }
        return flatVersions;
    }

    async getDependenciesFor(fixPkgVersion: FixPackageVersion): Promise<PackageDependencies> {
        const packageInfo = await this.getInfo(fixPkgVersion.name);

        const versions = packageInfo.versions;
        const targetVersion = fixPkgVersion.version.version;
        const npmPackage = versions[targetVersion];
        if (!npmPackage) {
            throw new Error(`Package ${fixPkgVersion.name} has not version ${targetVersion}`);
        }

        return {
            package: fixPkgVersion,
            dependencies: [
                ...toPackageDependencies(npmPackage.dependencies),
                ...toPackageDependencies(npmPackage.devDependencies)
            ]
        };
    }

    async getInfo(packageName: string): Promise<RegClient.GetResult> {
        const cached = this.infoCache.get(packageName);
        if (cached) {
            return cached;
        }

        let resolve: (deps?: RegClient.GetResult | undefined) => void;
        let reject: () => void;
        const promise = new Promise<RegClient.GetResult>((res, rej) => { resolve = res; reject = rej; });
        this.infoCache.set(packageName, promise);

        const uri = "https://registry.npmjs.org/" + packageName;
        this.client.get(uri, this.params, function (error, data, raw, res) {
            if (error || !data) {
                console.debug("Error fetching URI: " + uri);
                console.debug(error);
                reject();
                return;
            }

            resolve(data);
        });

        return promise;
    }
}

const toPackageDependencies = (dependencies: RegClient.NpmDependencies): PackageVersion[] => {
    const result: PackageVersion[] = [];
    for (const name in dependencies) {
        const version = dependencies[name];
        result.push(PackageVersion.create(name, version));
    }
    return result;
}
