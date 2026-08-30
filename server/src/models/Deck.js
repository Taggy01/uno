import { Card, COLORS, VALUES, WILD_VALUES } from './Card.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    let cardCount = 0;

    // Standard 108 UNO Cards:
    // 1 '0' per color (4 cards)
    // 2 '1'-'9', 'skip', 'reverse', 'draw2' per color (2 * 12 * 4 = 96 cards)
    // 4 Wild, 4 Wild Draw 4 (8 cards)
    // Total = 108 cards

    for (const color of COLORS) {
      // One '0' card
      this.cards.push(new Card(`${color}-0-${cardCount++}`, color, '0'));

      // Two cards for 1-9, skip, reverse, draw2
      for (const val of VALUES.filter((v) => v !== '0')) {
        this.cards.push(new Card(`${color}-${val}-${cardCount++}`, color, val));
        this.cards.push(new Card(`${color}-${val}-${cardCount++}`, color, val));
      }
    }

    // 4 Wild cards
    for (let i = 0; i < 4; i++) {
      this.cards.push(new Card(`wild-wild-${cardCount++}`, 'wild', 'wild'));
    }

    // 4 Wild Draw 4 cards
    for (let i = 0; i < 4; i++) {
      this.cards.push(new Card(`wild-wild4-${cardCount++}`, 'wild', 'wild4'));
    }

    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.cards.length === 0) break;
      drawn.push(this.cards.pop());
    }
    return drawn;
  }

  addCards(cards) {
    this.cards.unshift(...cards);
    this.shuffle();
  }

  get remaining() {
    return this.cards.length;
  }
}
