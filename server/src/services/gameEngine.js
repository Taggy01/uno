import { Game } from '../models/Game.js';
import { COLORS } from '../models/Card.js';
import { GameHistory } from '../models/GameHistory.js';
import { User } from '../models/User.js';

class GameEngine {
  constructor() {
    this.games = new Map(); // roomCode -> Game
    this.turnTimers = new Map(); // roomCode -> timeout
    this.broadcastCallback = null; // function(roomCode, event, data)
  }

  setBroadcastCallback(fn) {
    this.broadcastCallback = fn;
  }

  broadcast(roomCode, event, data) {
    if (this.broadcastCallback) {
      this.broadcastCallback(roomCode, event, data);
    }
  }

  createGame(roomCode, players) {
    const game = new Game(roomCode, players);
    this.games.set(roomCode, game);
    this.scheduleNextAction(roomCode);
    return game;
  }

  getGame(roomCode) {
    return this.games.get(roomCode) || null;
  }

  endGame(roomCode) {
    this.clearTurnTimer(roomCode);
    this.games.delete(roomCode);
  }

  clearTurnTimer(roomCode) {
    if (this.turnTimers.has(roomCode)) {
      clearTimeout(this.turnTimers.get(roomCode));
      this.turnTimers.delete(roomCode);
    }
  }

  scheduleNextAction(roomCode) {
    this.clearTurnTimer(roomCode);

    const game = this.getGame(roomCode);
    if (!game || game.status === 'ended') return;

    const currentPlayer = game.getCurrentPlayer();
    if (!currentPlayer) return;

    if (currentPlayer.isBot) {
      // Execute bot move after a realistic delay (1000ms - 2000ms)
      const timer = setTimeout(() => {
        this.executeBotTurn(roomCode, currentPlayer.id);
      }, 1200);
      this.turnTimers.set(roomCode, timer);
    } else {
      // Schedule turn timeout auto-draw/pass for AFK human players (30s)
      const timer = setTimeout(() => {
        this.handleTurnTimeout(roomCode, currentPlayer.id);
      }, 30000);
      this.turnTimers.set(roomCode, timer);
    }
  }

  executeBotTurn(roomCode, botId) {
    const game = this.getGame(roomCode);
    if (!game || game.status === 'ended') return;

    const bot = game.getCurrentPlayer();
    if (!bot || bot.id !== botId) return;

    // Also check if bot can catch any human player who forgot to call UNO
    for (const player of game.players) {
      if (player.id !== bot.id && player.cards.length === 1 && !player.calledUno) {
        // 70% chance bot catches player
        if (Math.random() < 0.7) {
          game.catchUno(bot.id, player.id);
          this.broadcast(roomCode, 'uno_caught', { catcher: bot.username, target: player.username });
        }
      }
    }

    // Find playable cards
    const playableCards = bot.cards.filter((c) => game.isPlayValid(c));

    if (playableCards.length > 0) {
      // Prioritize action cards / color cards over wilds
      const nonWilds = playableCards.filter((c) => c.color !== 'wild' && !c.value.startsWith('wild'));
      const chosenCard = nonWilds.length > 0
        ? nonWilds[Math.floor(Math.random() * nonWilds.length)]
        : playableCards[0];

      let chosenColor = null;
      if (chosenCard.color === 'wild' || chosenCard.value.startsWith('wild')) {
        // Pick bot's most frequent card color
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        bot.cards.forEach((c) => {
          if (colorCounts[c.color] !== undefined) colorCounts[c.color]++;
        });
        chosenColor = Object.keys(colorCounts).reduce((a, b) => (colorCounts[a] > colorCounts[b] ? a : b)) || 'red';
      }

      const result = game.playCard(bot.id, chosenCard.id, chosenColor);

      // Check if bot should call UNO after playing card down to 1 card
      if (bot.cards.length === 1 && !bot.calledUno) {
        game.callUno(bot.id);
        this.broadcast(roomCode, 'uno_called', { playerId: bot.id, username: bot.username });
      }

      this.broadcastGameState(roomCode);

      if (result.winner) {
        this.saveGameHistory(game);
        this.broadcast(roomCode, 'game_over', { winner: result.winner });
        return;
      }
    } else {
      // Bot must draw
      const drawResult = game.drawCard(bot.id);
      if (drawResult.success && drawResult.isPlayable && Math.random() < 0.8) {
        // Play drawn card if valid
        const drawnCard = drawResult.drawnCard;
        let chosenColor = null;
        if (drawnCard.color === 'wild' || drawnCard.value.startsWith('wild')) {
          chosenColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
        game.playCard(bot.id, drawnCard.id, chosenColor);

        // Check if bot should call UNO after playing drawn card down to 1 card
        if (bot.cards.length === 1 && !bot.calledUno) {
          game.callUno(bot.id);
          this.broadcast(roomCode, 'uno_called', { playerId: bot.id, username: bot.username });
        }
      } else if (drawResult.success && !drawResult.autoSkipped) {
        game.passTurn(bot.id);
      }
      this.broadcastGameState(roomCode);
    }

    this.scheduleNextAction(roomCode);
  }

  handleTurnTimeout(roomCode, playerId) {
    const game = this.getGame(roomCode);
    if (!game || game.status === 'ended') return;

    const player = game.getCurrentPlayer();
    if (!player || player.id !== playerId) return;

    game.addLog(`${player.username} ran out of time! Auto-drawing card.`);
    game.drawCard(player.id);
    game.passTurn(player.id);

    this.broadcastGameState(roomCode);
    this.scheduleNextAction(roomCode);
  }

  async saveGameHistory(game) {
    try {
      if (!game || !game.winner) return;

      await GameHistory.create({
        roomCode: game.roomCode,
        winner: game.winner,
        players: game.players.map((p) => ({
          id: p.id,
          username: p.username,
          isBot: p.isBot,
          cardsRemaining: p.cards.length,
        })),
        durationSeconds: Math.floor((Date.now() - game.turnStartTime) / 1000),
      });

      if (!game.winner.isBot) {
        await User.findByIdAndUpdate(game.winner.id, {
          $inc: { 'stats.gamesPlayed': 1, 'stats.wins': 1, 'stats.score': 100 },
        });
      }
    } catch (err) {
      // MongoDB logging warning
    }
  }

  broadcastGameState(roomCode) {
    const game = this.getGame(roomCode);
    if (!game) return;
    this.broadcast(roomCode, 'game_update', {
      topCard: game.topCard,
      activeColor: game.activeColor,
      currentTurnPlayerId: game.getCurrentPlayer()?.id,
      currentTurnUsername: game.getCurrentPlayer()?.username,
      direction: game.direction,
      deckRemaining: game.deck.remaining,
      discardPileCount: game.discardPile.length,
      status: game.status,
      winner: game.winner,
      logs: game.logs,
      players: game.players.map((p) => ({
        id: p.id,
        username: p.username,
        isBot: p.isBot,
        cardCount: p.cards.length,
        calledUno: p.calledUno,
      })),
    });
  }
}

export const gameEngine = new GameEngine();
