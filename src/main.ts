import { DependencySolver } from "./dependency-solver";
import { DependencyResolver } from "./dependency-resolver";
import { PackageVersion } from "./package-version";

const run = async () => {
    try {
        console.log("Start.");
        console.log("Resolving dependencies...");

        let resolvedDependencies;
        {
            const depResolver = new DependencyResolver();
            resolvedDependencies = await depResolver.resolveDependencies([PackageVersion.create('semver', '^5.0.0')]);
        }

        const depSolver = new DependencySolver();
        depSolver.solve(resolvedDependencies);
    } catch (err) {
        console.error(err);
    }
}

run();
