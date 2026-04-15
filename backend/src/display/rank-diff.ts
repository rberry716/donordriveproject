export type RankedEntry = {
    id: number;
    name: string;
    amount: number;
  };
  
  export type RankDelta = {
    id: number;
    name: string;
    amount: number;
    prevRank: number | null;
    newRank: number | null;
    direction: "up" | "down" | "same" | "new" | "dropped";
    magnitude: number;
  };
  
  export function computeRankDiff(previous: RankedEntry[], current: RankedEntry[]): RankDelta[] {
    const diff = new Map<number, number>();
    for (let i = 0; i < previous.length; i++) {
        diff.set(previous[i].id, i);
    }
    const output: RankDelta[] = [];
    for (let i = 0; i < current.length; i++) {
        const currentEntry = current[i];
        const prevRank = diff.get(currentEntry.id);
        if (prevRank !== undefined) {
            output.push({
                id: currentEntry.id,
                name: currentEntry.name,
                amount: currentEntry.amount,
                prevRank: prevRank,
                newRank: i,
                direction: prevRank > i ? "up" : prevRank < i ? "down" : "same",
                magnitude: Math.abs(prevRank - i),
            });
            diff.delete(currentEntry.id);
        } else {
            output.push({
                id: currentEntry.id,
                name: currentEntry.name,
                amount: currentEntry.amount,
                prevRank: null,
                newRank: i,
                direction: "new",
                magnitude: 0,
            });
        }
    }
    for (const id of diff.keys()) {
        const prevEntry = previous[diff.get(id)!];
        if (prevEntry) {
            output.push({
                id: id,
                name: prevEntry.name,
                amount: prevEntry.amount,
                prevRank: diff.get(id)!,
                newRank: null,
                direction: "dropped",
                magnitude: 0,
            });
        }
    }
    return output;
  }
  
  export class RollingLeaderboardHistory {
    private maxSize: number;
    private snapshots: RankedEntry[][];
    constructor(maxSize: number = 40) {
      this.maxSize = maxSize;
      this.snapshots = [];
    }
  
    push(snapshot: RankedEntry[]): void {
      // Add snapshot, trim to max size
      this.snapshots.push(snapshot);
      if (this.snapshots.length > this.maxSize) {
        this.snapshots.shift();
      }
    }
  
    getLatest(): RankedEntry[] | null {
      // Return most recent snapshot
      return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
    }
  }