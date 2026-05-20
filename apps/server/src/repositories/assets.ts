export interface LinkedAssetRow {
  storage_key: string;
}

export async function deleteOwnedAssetIfUnreferenced(
  db: D1Database,
  assets: R2Bucket,
  assetId: string,
  userId: string,
): Promise<void> {
  const linked = await db.prepare(
    `SELECT 1 WHERE
      EXISTS (SELECT 1 FROM maps WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM audio_assets WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM custom_terrain WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM monster_portraits WHERE asset_id = ?)
      OR EXISTS (SELECT 1 FROM npcs WHERE portrait_asset_id = ?)
      OR EXISTS (SELECT 1 FROM heroes WHERE portrait_asset_id = ? AND deleted_at IS NULL)
      OR EXISTS (SELECT 1 FROM heroes WHERE data LIKE ? AND deleted_at IS NULL)
     LIMIT 1`,
  )
    .bind(assetId, assetId, assetId, assetId, assetId, assetId, `%${assetId}%`)
    .first<{ 1: number }>();
  if (linked) return;

  const asset = await db.prepare('SELECT storage_key FROM assets WHERE id = ? AND user_id = ?')
    .bind(assetId, userId)
    .first<LinkedAssetRow>();
  if (!asset) return;

  await assets.delete(asset.storage_key);
  await db.prepare('DELETE FROM assets WHERE id = ?').bind(assetId).run();
}
