// Which demos belong to which review gate. A later task extends this list.
// ?gate=<n> shows these side by side. Ids are folder names under demos/.
export const gates: Record<string, string[]> = {
  '1': ['direction-a', 'direction-b', 'direction-c'],
  '2': ['battle-director', 'battle-director-1280', 'battle-director-dark', 'battle-director-end', 'battle-player', 'battle-player-1280', 'battle-player-dark', 'battle-turn-motion'],
  '3': ['story-director', 'story-player', 'montage-director', 'montage-player', 'montage-director-1280', 'montage-player-1280', 'negotiation-director', 'negotiation-player', 'negotiation-director-1280', 'negotiation-player-1280', 'respite-director', 'respite-player', 'scene-change-motion'],
  '4': ['phone-player', 'phone-director', 'phone-player-negotiation', 'phone-director-negotiation', 'display', 'display-story', 'states'],
};
