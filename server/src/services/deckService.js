export const CARD_SCORES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'skip': 20, 'reverse': 20, 'draw2': 20,
  'wild': 50, 'wild4': 50
};

export function calculateHandScore(cards) {
  return cards.reduce((sum, card) => sum + (CARD_SCORES[card.value] || 0), 0);
}
