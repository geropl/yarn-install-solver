declare module "npm-registry-client" {

    namespace RegClient {
        interface Config {
            // ???
        }

        type AuthParams = AuthBasic | AuthToken;

        interface AuthBasic {
            username: string
            password: string
            email: string
            alwaysAuth: boolean
        }

        interface AuthToken {
            token: string
            alwaysAuth: boolean
        }

        // client.get(uri, params, cb)
        type GetParams = Partial<{
            package: string
            timeout: number
            follow: boolean
            staleOk: boolean
            auth: AuthParams
            fullMetadata: boolean
        }>

        interface NpmPackage {
            name: string
            version: string
            dependencies: NpmDependencies,
            devDependencies: NpmDependencies
            // ???
        }

        interface NpmDependencies {
            [package: string]: string
        }

        interface GetResult {
            versions: {
                [version: string]: NpmPackage
            }
            // ???
        }

        interface GetCallback {
            (error: any | undefined, data: GetResult, raw: string, res: any): void;
        }
    }

    class RegClient {
        constructor(config: RegClient.Config);
        get(uri: string, params: RegClient.GetParams, cb: RegClient.GetCallback): void;
    }
    export = RegClient;
}
