import type { EntityData, ParticipantInfo } from "../../types/protocol.js";

export interface PlayerCharacterRow {
  participant: ParticipantInfo;
  hero: EntityData | null;
}

export function getJoinedPlayerCharacters(
  participants: ParticipantInfo[],
  entities: EntityData[],
): PlayerCharacterRow[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  return participants
    .filter(
      (participant) => participant.role === "player" && participant.heroId,
    )
    .map((participant) => ({
      participant,
      hero: entityById.get(participant.heroId ?? "") ?? null,
    }))
    .sort((a, b) => {
      if (a.participant.connected !== b.participant.connected) {
        return a.participant.connected ? -1 : 1;
      }
      const aName = a.hero?.name ?? a.participant.username;
      const bName = b.hero?.name ?? b.participant.username;
      return aName.localeCompare(bName);
    });
}
