import { DependencySolver } from "./dependency-solver";
import { DependencyResolver } from "./dependency-resolver";
import { FixPackageVersion } from "./package-version";
import { NpmInfoProvider } from "./npm-info-provider";
import { SemVer } from "semver";

const run = async () => {
    try {
        console.log("Start.");

        const npmInfoProvider = new NpmInfoProvider();
        const rootDeps = await npmInfoProvider.getDependenciesFor(new FixPackageVersion('theia', new SemVer('2.1.2')));

        console.log("Resolving dependencies...");

        let resolvedDependencies;
        {
            const depResolver = new DependencyResolver();
            resolvedDependencies = await depResolver.resolveDependencies(rootDeps.dependencies);
        }

        const depSolver = new DependencySolver();
        depSolver.solve(resolvedDependencies);
    } catch (err) {
        console.error(err);
    }
}

run();
