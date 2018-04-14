import * as Logic from 'logic-solver';
import { ResolvedDependencies } from './dependency-resolver';
import { PackageVersion, FixPackageVersion } from './package-version';
import { PackageDependencies } from './npm-info-provider';


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

        // Prepare result
        const packages = this.createPackageVersionList(result.getTrueVars());
        console.log("Result: " );
        for (const pkg of packages) {
            console.log("Package: " + pkg.package.name);
            console.log("Patterns: " + pkg.dependencies.reduce((all, c) => (all ? all + ', ' : '') + c.toString(), ''));
            console.log("Result: " + pkg.package.toString());
        }
    }

    protected reduceToStrings(pkgVersions: PackageVersion[]): string[] {
        return pkgVersions.reduce<string[]>((r, v) => [ ...r, v.toString()], []);
    }

    protected createPackageVersionList(versions: string[]): PackageDependencies[] {
        const resultMap = new Map<string,{result?: FixPackageVersion, patterns: PackageVersion[]}>();
        const todo = versions;

        while (todo.length > 0) {
            const str = todo.pop()!;
            const [name, version] = str.split(':', 2);

            let resultEntry = resultMap.get(name);
            if (!resultEntry) {
                resultEntry = { patterns: [] };
                resultMap.set(name, resultEntry);
            }

            const pkgVersion = PackageVersion.create(name, version);
            if (pkgVersion instanceof FixPackageVersion) {
                if (resultEntry.result !== undefined) {
                    console.warn("More then one fixed version: " + pkgVersion.toString());
                } else {
                    resultEntry.result = pkgVersion;
                }
            }
            resultEntry.patterns.push(pkgVersion);
        }

        const result: PackageDependencies[] = [];
        resultMap.forEach(e => {
            if (!e.result) throw new Error("No fix version for: " + JSON.stringify(e.patterns));
            result.push({ package: e.result, dependencies: e.patterns })
        });
        return result;
    }
}
