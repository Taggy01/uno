import { Deck } from './Deck.js';
import { Card } from './Card.js';

export class Game {
  constructor(roomCode, players) {
    this.roomCode = roomCode;
    this.players = players.map((p) => ({
      id: p.id,
      username: p.username,
      isBot: Boolean(p.isBot),
      cards: [],
      calledUno: false,
      hasDrawnThisTurn: false,
      score: 0,
    }));
    this.deck = new Deck();
    this.discardPile = [];
    this.activeColor = null; // 'red' | 'blue' | 'green' | 'yellow'
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.status = 'in_progress'; // 'in_progress' | 'ended'
    this.winner = null;
    this.logs = [];
    this.turnTimer = 30; // seconds per turn
    this.turnStartTime = Date.now();

    this.init();
  }

  addLog(message) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    if (this.logs.length > 25) this.logs.pop();
  }

  init() {
    this.deck.reset();

    // Deal 7 cards to each player
    for (const player of this.players) {
      player.cards = this.deck.draw(7);
      player.calledUno = false;
      player.hasDrawnThisTurn = false;
    }

    // Flip top card from deck to discard pile. If Wild4, re-draw until non-Wild4
    let firstCard = this.deck.draw(1)[0];
    while (firstCard.value === 'wild4') {
      this.deck.addCards([firstCard]);
      firstCard = this.deck.draw(1)[0];
    }

    this.discardPile.push(firstCard);
    this.activeColor = firstCard.color === 'wild' ? 'red' : firstCard.color;

    this.addLog(`Game started! Initial card: ${firstCard.color.toUpperCase()} ${firstCard.value.toUpperCase()}`);

    // Apply first card effect if action card
    if (firstCard.value === 'skip') {
      this.addLog(`${this.getCurrentPlayer().username} was skipped by initial card!`);
      this.advanceTurn(1);
    } else if (firstCard.value === 'reverse') {
      if (this.players.length === 2) {
        this.addLog(`Reverse on 2 players acts like Skip!`);
        this.advanceTurn(1);
      } else {
        this.direction *= -1;
        this.addLog(`Turn direction reversed!`);
        this.currentTurnIndex = (this.players.length - 1) % this.players.length;
      }
    } else if (firstCard.value === 'draw2') {
      const target = this.getCurrentPlayer();
      const drawn = this.drawCardsForPlayer(target, 2);
      this.addLog(`${target.username} drew 2 cards from initial card and turn skipped!`);
      this.advanceTurn(1);
    }

    this.resetTurnFlags();
  }

  get topCard() {
    return this.discardPile[this.discardPile.length - 1];
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  resetTurnFlags() {
    this.turnStartTime = Date.now();
    const current = this.getCurrentPlayer();
    if (current) {
      current.hasDrawnThisTurn = false;
    }
  }

  advanceTurn(steps = 1) {
    const n = this.players.length;
    this.currentTurnIndex = (this.currentTurnIndex + this.direction * steps) % n;
    if (this.currentTurnIndex < 0) {
      this.currentTurnIndex += n;
    }
    this.resetTurnFlags();
  }

  ensureDeckHasCards(needed = 1) {
    if (this.deck.remaining < needed) {
      if (this.discardPile.length <= 1) return; // Cannot reshuffle if only top card
      const top = this.discardPile.pop();
      const recycledCards = this.discardPile.splice(0, this.discardPile.length);
      this.deck.addCards(recycledCards);
      this.discardPile.push(top);
      this.addLog(`Discard pile reshuffled back into deck.`);
    }
  }

  drawCardsForPlayer(player, count = 1) {
    this.ensureDeckHasCards(count);
    const drawn = this.deck.draw(count);
    player.cards.push(...drawn);
    // Reset UNO call state if player had called Uno and gets more cards
    if (player.cards.length > 1) {
      player.calledUno = false;
    }
    return drawn;
  }

  isPlayValid(card) {
    if (!card) return false;
    if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild4') {
      return true;
    }
    return card.color === this.activeColor || card.value === this.topCard.value;
  }

  playCard(playerId, cardId, chosenColor) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: "It's not your turn!" };
    }

    const cardIndex = player.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not found in your hand.' };
    }

    const card = player.cards[cardIndex];

    if (!this.isPlayValid(card)) {
      return { success: false, error: 'Invalid move! Card must match color or value.' };
    }

    // Handle wild color selection
    if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild4') {
      if (!chosenColor || !['red', 'blue', 'green', 'yellow'].includes(chosenColor)) {
        return { success: false, error: 'Please choose a valid color (red, blue, green, yellow).' };
      }
      this.activeColor = chosenColor;
    } else {
      this.activeColor = card.color;
    }

    // Remove from player hand and add to discard pile
    player.cards.splice(cardIndex, 1);
    this.discardPile.push(card);

    let logMsg = `${player.username} played ${card.color.toUpperCase()} ${card.value.toUpperCase()}`;
    if (card.color === 'wild' || card.value.startsWith('wild')) {
      logMsg += ` (Selected ${chosenColor.toUpperCase()})`;
    }
    this.addLog(logMsg);

    // Check Uno call warning: if player has 1 card left and didn't call Uno
    if (player.cards.length === 1 && !player.calledUno) {
      // Player has a grace window or can be caught!
    }

    // Check Win condition
    if (player.cards.length === 0) {
      this.status = 'ended';
      this.winner = {
        id: player.id,
        username: player.username,
        isBot: player.isBot,
      };
      this.addLog(`🎉 ${player.username} WON THE GAME! 🎉`);
      return { success: true, winner: this.winner, card };
    }

    // Action Card Effects
    let nextStep = 1;
    if (card.value === 'skip') {
      const skippedPlayer = this.players[(this.currentTurnIndex + this.direction + this.players.length) % this.players.length];
      this.addLog(`${skippedPlayer.username}'s turn was skipped!`);
      nextStep = 2;
    } else if (card.value === 'reverse') {
      if (this.players.length === 2) {
        this.addLog(`Reverse acts as Skip in 2-player match!`);
        nextStep = 2;
      } else {
        this.direction *= -1;
        this.addLog(`Direction reversed!`);
        nextStep = 1;
      }
    } else if (card.value === 'draw2') {
      const nextIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
      const target = this.players[nextIndex];
      this.drawCardsForPlayer(target, 2);
      this.addLog(`${target.username} drew 2 cards and was skipped!`);
      nextStep = 2;
    } else if (card.value === 'wild4') {
      const nextIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
      const target = this.players[nextIndex];
      this.drawCardsForPlayer(target, 4);
      this.addLog(`${target.username} drew 4 cards and was skipped!`);
      nextStep = 2;
    }

    this.advanceTurn(nextStep);
    return { success: true, card };
  }

  drawCard(playerId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: "It's not your turn!" };
    }

    if (player.hasDrawnThisTurn) {
      return { success: false, error: 'You have already drawn a card this turn! Pass or play a card.' };
    }

    const drawn = this.drawCardsForPlayer(player, 1);
    const drawnCard = drawn[0];
    const isPlayable = drawnCard ? this.isPlayValid(drawnCard) : false;

    if (!isPlayable) {
      this.addLog(`${player.username} drew a card (unplayable). Turn auto-skipped.`);
      this.advanceTurn(1);
      return {
        success: true,
        drawnCard,
        isPlayable: false,
        autoSkipped: true,
      };
    }

    player.hasDrawnThisTurn = true;
    this.addLog(`${player.username} drew a card.`);

    return {
      success: true,
      drawnCard,
      isPlayable: true,
      autoSkipped: false,
    };
  }

  passTurn(playerId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) {
      return { success: false, error: "It's not your turn!" };
    }

    if (!player.hasDrawnThisTurn) {
      return { success: false, error: 'You must draw a card before passing your turn.' };
    }

    this.addLog(`${player.username} passed the turn.`);
    this.advanceTurn(1);
    return { success: true };
  }

  callUno(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found' };

    if (player.cards.length === 1) {
      player.calledUno = true;
      this.addLog(`📢 ${player.username} CALLED UNO! 🚨`);
      return { success: true, username: player.username };
    }

    return { success: false, error: 'UNO can only be called when you have exactly 1 card left!' };
  }

  catchUno(callerId, targetPlayerId) {
    const caller = this.players.find((p) => p.id === callerId);
    const target = this.players.find((p) => p.id === targetPlayerId);

    if (!target) return { success: false, error: 'Target player not found' };

    // If target has exactly 1 card and has NOT called UNO
    if (target.cards.length === 1 && !target.calledUno) {
      this.drawCardsForPlayer(target, 2);
      this.addLog(`🚨 ${caller ? caller.username : 'Someone'} caught ${target.username} not saying UNO! +2 Cards penalty!`);
      return { success: true, targetName: target.username };
    }

    return { success: false, error: `${target.username} has either called UNO or does not have 1 card!` };
  }

  // Returns view for a specific player (hiding others' cards for anti-cheat)
  getState(forPlayerId) {
    return {
      roomCode: this.roomCode,
      status: this.status,
      topCard: this.topCard,
      activeColor: this.activeColor,
      currentTurnPlayerId: this.getCurrentPlayer()?.id,
      currentTurnUsername: this.getCurrentPlayer()?.username,
      direction: this.direction,
      deckRemaining: this.deck.remaining,
      discardPileCount: this.discardPile.length,
      winner: this.winner,
      logs: this.logs,
      hasDrawnThisTurn: this.getCurrentPlayer()?.hasDrawnThisTurn || false,
      players: this.players.map((p) => ({
        id: p.id,
        username: p.username,
        isBot: p.isBot,
        cardCount: p.cards.length,
        calledUno: p.calledUno,
        // Only return card details if this is the player's own perspective
        cards: p.id === forPlayerId ? p.cards : undefined,
      })),
    };
  }
}
