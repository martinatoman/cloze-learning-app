export interface LevelProgression {
    level: number;
    currentXP: number;
    nextLevelXP: number;
}

export function calculateLevel(totalXP: number): LevelProgression {
    let level = 1;
    let xpRemaining = Math.max(0, totalXP);
    let xpNeededForNextLevel = level * 100;

    while (xpRemaining >= xpNeededForNextLevel) {
        xpRemaining -= xpNeededForNextLevel;
        level++;
        xpNeededForNextLevel = level * 100;
    }

    return {
        level,
        currentXP: xpRemaining,
        nextLevelXP: xpNeededForNextLevel,
    };
}