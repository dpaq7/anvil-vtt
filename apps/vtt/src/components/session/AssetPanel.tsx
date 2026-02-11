import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@anvil/ui';
import { useAssetsStore } from '../../stores/assetsStore.js';
import { HeroGrid } from '../assets/HeroGrid.js';
import { NpcGrid } from '../assets/NpcGrid.js';
import { MapGrid } from '../assets/MapGrid.js';
import { BestiaryTable } from '../assets/BestiaryTable.js';
import { TerrainGrid } from '../assets/TerrainGrid.js';
import { AudioGrid } from '../assets/AudioGrid.js';
import { RespiteActivityList } from '../assets/RespiteActivityList.js';
import { RespiteActivityCard } from '../assets/RespiteActivityCard.js';
import { MontageTestCatalog } from '../assets/MontageTestCatalog.js';
import { MontageTestTracker } from '../assets/MontageTestTracker.js';
import { ALL_TERRAINS, loadMonsters, isMonsterStatblock, FORGESTEEL_MONSTERS } from '@anvil/data';
import type { SceneType, ActivityCard as ActivityCardType, MontageTestRecord } from '@anvil/types';
import type { HeroSummary } from '@anvil/types';
import type { CompendiumMonster } from '@anvil/data';

// ── Tab configuration per scene type ──

type AssetTab =
  | 'heroes'
  | 'npcs'
  | 'maps'
  | 'bestiary'
  | 'terrain'
  | 'audio'
  | 'activities'
  | 'montage_tests';

const SCENE_TABS: Record<SceneType, AssetTab[]> = {
  battle: ['bestiary', 'heroes', 'terrain', 'maps'],
  negotiation: ['npcs', 'heroes', 'maps'],
  montage: ['montage_tests', 'npcs', 'maps'],
  story: ['npcs', 'heroes', 'maps'],
  respite: ['activities', 'npcs', 'maps'],
};

const TAB_LABELS: Record<AssetTab, string> = {
  heroes: 'Heroes',
  npcs: 'NPCs',
  maps: 'Maps',
  bestiary: 'Bestiary',
  terrain: 'Terrain',
  audio: 'Audio',
  activities: 'Activities',
  montage_tests: 'Tests',
};

export interface AssetPanelProps {
  sceneType: SceneType;
  sceneId: string;
  campaignId: string;
  heroCount: number;
  heroes?: HeroSummary[];
  monsters?: CompendiumMonster[];
  /** Live-session override: create entities via WebSocket instead of HTTP store. */
  onAddMonsterToScene?: (monsterName: string, quantity: number) => void;
}

export function AssetPanel({
  sceneType,
  sceneId,
  campaignId,
  heroCount,
  heroes = [],
  monsters: monstersProp,
  onAddMonsterToScene,
}: AssetPanelProps) {
  const tabs = SCENE_TABS[sceneType] ?? ['heroes', 'maps'];

  // Self-load monsters from compendium if not provided via props
  const [loadedMonsters, setLoadedMonsters] = useState<CompendiumMonster[]>([]);
  useEffect(() => {
    if (monstersProp && monstersProp.length > 0) return;
    loadMonsters()
      .then((data) => {
        const statblocks = data.items.filter(isMonsterStatblock) as CompendiumMonster[];
        const ids = new Set(statblocks.map((m) => m._id));
        const supplementary = FORGESTEEL_MONSTERS.filter((m) => !ids.has(m._id));
        setLoadedMonsters(
          [...statblocks, ...supplementary].sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => setLoadedMonsters([]));
  }, [monstersProp]);
  const monsters = monstersProp && monstersProp.length > 0 ? monstersProp : loadedMonsters;

  const {
    npcs,
    maps,
    customTerrain,
    audioAssets,
    activityCards,
    montageTests,
    loadNpcs,
    loadMaps,
    loadCustomTerrain,
    loadAudio,
    loadActivityCards,
    loadMontageTests,
    createActivityCard,
    updateActivityCard,
    deleteActivityCard,
    createMontageTest,
    updateMontageTest,
    deleteMontageTest,
    addSceneMonster,
  } = useAssetsStore();

  // Load data when campaignId / sceneId changes
  useEffect(() => {
    if (!campaignId) return;
    loadNpcs(campaignId);
    loadMaps(campaignId);
    loadCustomTerrain(campaignId);
    loadAudio(campaignId);
    loadActivityCards(campaignId);
  }, [campaignId, loadNpcs, loadMaps, loadCustomTerrain, loadAudio, loadActivityCards]);

  useEffect(() => {
    if (!sceneId) return;
    loadMontageTests(sceneId);
  }, [sceneId, loadMontageTests]);

  // Filter active activity cards
  const activeActivities = useMemo(
    () => activityCards.filter((a) => a.isActive),
    [activityCards],
  );

  // Filter active montage tests
  const activeTests = useMemo(
    () => montageTests.filter((t) => t.status === 'in_progress'),
    [montageTests],
  );

  const renderTabContent = (tab: AssetTab) => {
    switch (tab) {
      case 'heroes':
        return (
          <HeroGrid
            heroes={heroes}
            onSelect={() => {}}
            compact
          />
        );

      case 'npcs':
        return (
          <NpcGrid
            npcs={npcs}
            onSelect={() => {}}
            compact
          />
        );

      case 'maps':
        return (
          <MapGrid
            maps={maps}
            onSelect={() => {}}
            compact
          />
        );

      case 'bestiary':
        return (
          <BestiaryTable
            monsters={monsters}
            compact
            onAddToScene={(monsterName, quantity) => {
              if (onAddMonsterToScene) {
                onAddMonsterToScene(monsterName, quantity);
              } else {
                addSceneMonster(sceneId, { monsterName, quantity });
              }
            }}
            availableScenes={[{ id: sceneId, name: 'Current Scene', sceneType }]}
          />
        );

      case 'terrain':
        return (
          <TerrainGrid
            builtInTerrains={ALL_TERRAINS}
            customTerrains={customTerrain}
            compact
          />
        );

      case 'audio':
        return (
          <AudioGrid
            audioAssets={audioAssets}
            onSelect={() => {}}
            compact
          />
        );

      case 'activities':
        return (
          <div className="flex flex-col gap-3 p-3">
            {/* Active activity cards */}
            {activeActivities.map((card: ActivityCardType) => (
              <RespiteActivityCard
                key={card.id}
                card={card}
                onUpdate={(input) =>
                  updateActivityCard(campaignId, card.id, input)
                }
                onDelete={() => deleteActivityCard(campaignId, card.id)}
              />
            ))}

            {/* Activity catalog to add new */}
            <RespiteActivityList
              onSelect={(input) => createActivityCard(campaignId, input)}
            />
          </div>
        );

      case 'montage_tests':
        return (
          <div className="flex flex-col gap-3 p-3">
            {/* Active test trackers */}
            {activeTests.map((test: MontageTestRecord) => (
              <MontageTestTracker
                key={test.id}
                test={test}
                onUpdate={(input) =>
                  updateMontageTest(sceneId, test.id, input)
                }
                onDelete={() => deleteMontageTest(sceneId, test.id)}
              />
            ))}

            {/* Montage test catalog */}
            <MontageTestCatalog
              heroCount={heroCount}
              onSelect={(input) => createMontageTest(sceneId, input)}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <Tabs defaultValue={tabs[0]} className="flex flex-col overflow-hidden">
        <TabsList className="h-8 shrink-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-2 py-1 text-xs"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="flex-1 overflow-y-auto"
          >
            {renderTabContent(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
