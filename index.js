const { Octokit } = require("@octokit/core");
const core = require("@actions/core");
const { Console } = require("console");

function getVersionId(packages, version)  {
    for (var i=0; i < packages.length; i++) {
        if (packages[i].name === version) {
            return packages[i].id;
        }
    }
}

async function findAndDeletePackageVersion(org, package_type, package_name, version, token) {
    const octokit = new Octokit({ auth: token });

    // Handle response
    octokit.hook.after("request", async (response, options) => {
        const version_id = getVersionId(response.data, version);
        if (version_id == null) {
            core.setFailed(`Version ${version} not found`);
        } else {
            deletePackageVersion(org, package_type, package_name, version, version_id, token);
        }
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        core.setFailed(error.message);
    });

    if (org === null || org === "") {
        await octokit.request('GET /user/packages/{package_type}/{package_name}/versions', {
            package_type: package_type,
            package_name: package_name
        });
    } else {
        await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
            org: org,
            package_type: package_type,
            package_name: package_name
        });
    }
}

async function deletePackageVersion(org, package_type, package_name, version, version_id, token) {
    const octokit = new Octokit({ auth: token });

    // Handle response
    octokit.hook.after("request", async (response, options) => {
        console.log(`Deleted version ${version} successfully`);
    });

    // Handle error
    octokit.hook.error("request", async (error, options) => {
        if (error != null) {
            console.log(`Unable to delete version ${version}. Error: ${error}`)
            core.setFailed(error);
        }
    });

    if (org === null || org === "") {
        await octokit.request('DELETE /user/packages/{package_type}/{package_name}/versions/{version_id}', {
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    } else {
        await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{version_id}', {
            org: org,
            package_type: package_type,
            package_name: package_name,
            version_id: version_id
        });
    }
}

async function run() {
    const org = core.getInput("ORG");
    const package_type = core.getInput("PACKAGE_TYPE");
    const package_name = core.getInput("PACKAGE_NAME");
    const version =  core.getInput("VERSION");
    const token = core.getInput("TOKEN");

    findAndDeletePackageVersion(org, package_type, package_name, version, token);
}

run();
