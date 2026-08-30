export const COLORS = ['red', 'blue', 'green', 'yellow'];
export const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
export const WILD_VALUES = ['wild', 'wild4'];

export class Card {
  constructor(id, color, value) {
    this.id = id; // Unique ID like "red-7-1", "wild-wild4-0"
    this.color = color; // 'red' | 'blue' | 'green' | 'yellow' | 'wild'
    this.value = value; // '0' - '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'
  }

  isWild() {
    return this.color === 'wild' || this.value === 'wild' || this.value === 'wild4';
  }

  matches(topCard, activeColor) {
    if (this.isWild()) return true;
    const currentColor = activeColor || topCard.color;
    if (this.color === currentColor) return true;
    if (this.value === topCard.value) return true;
    return false;
  }
}
