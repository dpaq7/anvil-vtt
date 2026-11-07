import { describe, expect, it } from 'vitest';
import { parseCampaignPackageImport } from './campaign-package.js';

function request() {
  return {
    manifest: {
      format: 'anvil.campaign-package',
      version: 1,
      document: {
        format: 'anvil.scene-import',
        version: 1,
        campaign: { name: 'Test' },
        sessions: [{ name: 'One', scenes: [{ title: 'Start', type: 'story', data: { image: 'anvil-asset://map-one' } }] }],
      },
      assets: [{
        ref: 'map-one', path: 'assets/map.jpg', name: 'Map', type: 'map', contentType: 'image/jpeg', size: 100,
        sha256: 'a'.repeat(64), registrations: [{ kind: 'map', name: 'Map', gridType: 'gridless' }],
      }],
      content: {
        terrain: [{ name: 'Machine 1', category: 'mechanism' }],
        npcs: [{ name: 'Letitia' }],
        bestiary: [{ name: 'Gerold', anvilMapping: 'campaign-inline' }],
      },
    },
    uploadedAssets: { 'map-one': 'asset-id' },
  };
}

describe('parseCampaignPackageImport', () => {
  it('accepts a complete version 1 package contract', () => {
    const result = parseCampaignPackageImport(request());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.manifest.content?.terrain?.[0]?.name).toBe('Machine 1');
  });

  it('rejects path traversal in an archive descriptor', () => {
    const value = request();
    value.manifest.assets[0]!.path = '../map.jpg';
    expect(parseCampaignPackageImport(value)).toMatchObject({ ok: false });
  });

  it('requires an uploaded asset id for every descriptor', () => {
    const value = request();
    value.uploadedAssets = {};
    expect(parseCampaignPackageImport(value)).toMatchObject({ ok: false, error: 'Every package asset must be uploaded' });
  });
});
