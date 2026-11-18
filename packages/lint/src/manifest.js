// Checks an Even Hub app.json against the store rules in the device profile that
// evenhub pack does not check. The CLI already rejects a bad package_id, edition, version,
// name length, permission shape and a missing entrypoint.

// x.y.z with an optional -prerelease and +build, as semver writes them.
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

// True when version is semver and sorts before the floor release.
function belowFloor(version, floor) {
  const v = typeof version === 'string' && SEMVER.exec(version);
  const f = SEMVER.exec(floor);
  if (!v || !f) return false;
  for (let i = 1; i <= 3; i++) {
    if (Number(v[i]) !== Number(f[i])) return Number(v[i]) < Number(f[i]);
  }
  return v[4] !== undefined; // 0.0.14-rc.1 comes before 0.0.14
}

const finding = (rule, severity, fact, message) => ({ rule, severity, basis: 'vendor', message, source: fact.source, grade: fact.grade });

export function checkManifest(manifest, device) {
  const store = device.store;
  if (!store) throw new Error(`No store rules for ${device.name}; --manifest applies to Even Hub apps.`);
  const findings = [];

  const floor = store.minSdkVersion;
  const declared = manifest.min_sdk_version;
  if (declared == null) {
    findings.push(finding('manifest/min-sdk', 'error', floor, `app.json has no min_sdk_version. The store requires ${floor.value} or later.`));
  } else if (typeof declared !== 'string' || !SEMVER.test(declared)) {
    findings.push(
      finding('manifest/min-sdk', 'warn', floor, `min_sdk_version ${JSON.stringify(declared)} is not an x.y.z version, so the store floor ${floor.value} was not checked.`),
    );
  } else if (belowFloor(declared, floor.value)) {
    findings.push(
      finding('manifest/min-sdk', 'error', floor, `min_sdk_version is ${declared}. The store requires ${floor.value} or later.`),
    );
  }

  const reserved = store.reservedName;
  const name = String(manifest.name ?? '');
  const hit = name.toLowerCase().indexOf(reserved.value.toLowerCase());
  if (hit >= 0) {
    findings.push(
      finding(
        'manifest/name',
        'warn',
        reserved,
        `The name "${name}" contains "${name.slice(hit, hit + reserved.value.length)}". The store rejects names that contain "${reserved.value}" in any case, unless the app is officially affiliated.`,
      ),
    );
  }

  const whitelist = store.networkWhitelist;
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  permissions.forEach((p, i) => {
    if (!whitelist.value || p?.name !== 'network' || (Array.isArray(p.whitelist) && p.whitelist.length)) return;
    findings.push(
      finding(
        'manifest/network-whitelist',
        'warn',
        whitelist,
        `permissions[${i}], network, has no whitelist. The submission guidelines require one; the packaging page calls it optional.`,
      ),
    );
  });
  return findings;
}
