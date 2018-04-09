import * as Logic from 'logic-solver';
import { ResolvedDependencies } from './dependency-resolver';
import { PackageVersion } from './package-version';


export class DependencySolver {

    public solve(deps: ResolvedDependencies) {
        const solver = new Logic.Solver();

        console.log("Generating equations...");

        // 1. require all root dependencies
        console.log("Add root package versions...");
        solver.require(Logic.and(...this.reduceToStrings(deps.rootPackages)));

        // 2. Add all mappings for flattened versions of the form: rimraf:^1.0.0 = [rimraf:1.0.0, rimraf:1.0.1, rimraf:1.0.2]
        console.log("Add all version mapping...");
        for (const flattenedVersion of deps.flattenedVersions) {
            const range = flattenedVersion.package.toString();
            const flatVersions = this.reduceToStrings(flattenedVersion.dependencies);
            solver.require(Logic.equiv(range, Logic.exactlyOne(...flatVersions)));
        }

        // 3. Add all dependencies for fix versions of the form: rimraf:1.0.0 = [grep:^2.0.0, abc:1.2.3]
        console.log("Add all dependencies...");
        for (const pkgDependencies of deps.dependencies) {
            const fixVersion = pkgDependencies.package.toString();
            const dependencies = this.reduceToStrings(pkgDependencies.dependencies);
            solver.require(Logic.implies(fixVersion, Logic.and(...dependencies)));
        }

        // 4. Exclude all missing packages
        console.log("Exclude missing packages...");
        for (const missingPackage of deps.missingPackages) {
            solver.require(Logic.not(missingPackage.toString()));
        }

        console.log("Equations generated.");

        console.log("Solving...");
        const result = solver.solve();
        console.log("Done.");

        if (result === null) {
            console.log("Dependencies not solvable, quitting.");
            return;
        }

        console.log("Result: " + JSON.stringify(result.getTrueVars()));
    }

    protected reduceToStrings(pkgVersions: PackageVersion[]): string[] {
        return pkgVersions.reduce<string[]>((r, v) => [ ...r, v.toString()], []);
    }
}
