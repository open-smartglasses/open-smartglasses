// Checks an Even Hub app.json against the store rules in the device profile that
// evenhub pack does not check. The CLI already rejects a bad package_id, edition, version,
// name length, permission shape and a missing entrypoint.

// Compares dotted version strings numerically.
function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
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
  } else if (compareVersions(declared, floor.value) < 0) {
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
  const network = (Array.isArray(manifest.permissions) ? manifest.permissions : []).find(p => p?.name === 'network');
  if (whitelist.value && network && !(Array.isArray(network.whitelist) && network.whitelist.length)) {
    findings.push(
      finding(
        'manifest/network-whitelist',
        'warn',
        whitelist,
        'The network permission has no whitelist. The submission guidelines require one; the packaging page calls it optional.',
      ),
    );
  }
  return findings;
}
