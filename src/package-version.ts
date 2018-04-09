import * as semver from "semver";

export interface PackageVersion {
    name: string;
    contains(other: string | semver.SemVer): boolean;
    toString(): string;
    isFix(): boolean;
}

export namespace PackageVersion {
    export const create = (name: string, version: string | semver.SemVer | semver.Range) => {
        if (typeof version === 'string') {
            if (semver.validRange(version)) {
                return new RangePackageVersion(name, new semver.Range(version));
            } else if (semver.valid(version)) {
                return new FixPackageVersion(name, new semver.SemVer(version));
            } else {
                return new FixExoticPackageVersion(name, version);
            }
        } else {
            if (version instanceof semver.SemVer) {
                return new FixPackageVersion(name, version);
            } else {
                return new RangePackageVersion(name, version);
            }
        }
    }
}

export class FixPackageVersion implements PackageVersion {
    constructor(readonly name: string,
        readonly version: semver.SemVer) {}

    contains(other: string | semver.SemVer) {
        return this.version.compare(other) === 0;
    }

    toString(): string {
        return this.name + ":" + this.version.version;
    }

    isFix() {
        return true;
    }
}

export class RangePackageVersion implements PackageVersion {
    constructor(readonly name: string,
        readonly range: semver.Range) {}

    contains(other: string | semver.SemVer) {
        return this.range.test(other);
    }

    toString(): string {
        return this.name + ":" + this.range.raw;
    }

    isFix() {
        return false;
    }
}

export class FixExoticPackageVersion implements PackageVersion {
    constructor(readonly name: string,
        readonly version: string) {}

    contains(other: string | semver.SemVer) {
        return typeof other === 'string' && other === this.version;
    }

    toString(): string {
        return this.name + ":" + this.version;
    }

    isFix() {
        return true;
    }
}
