export class Room {
  constructor({ code, name, maxPlayers = 4, hostId, hostUsername, isPrivate = false }) {
    this.code = code;
    this.name = name || `Room ${code}`;
    this.maxPlayers = Math.min(Math.max(Number(maxPlayers) || 4, 2), 10);
    this.hostId = hostId;
    this.isPrivate = Boolean(isPrivate);
    this.status = 'lobby'; // 'lobby' | 'playing' | 'finished'
    this.players = [];
    this.game = null;
    this.createdAt = new Date();

    if (hostId) {
      this.players.push({
        id: hostId,
        username: hostUsername || 'Host',
        socketId: null,
        isHost: true,
        isBot: false,
        ready: true,
      });
    }
  }

  addPlayer({ id, username, socketId, isBot = false }) {
    const existing = this.players.find((p) => p.id === id);
    if (existing) {
      existing.socketId = socketId;
      existing.username = username || existing.username;
      return existing;
    }

    if (this.status !== 'lobby') {
      throw new Error('Game already in progress');
    }
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }

    const newPlayer = {
      id,
      username: username || `Player ${this.players.length + 1}`,
      socketId,
      isHost: this.players.length === 0,
      isBot,
      ready: isBot ? true : false,
    };

    if (newPlayer.isHost) {
      this.hostId = id;
    }

    this.players.push(newPlayer);
    return newPlayer;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) return null;

    const removed = this.players.splice(index, 1)[0];

    if (removed.isHost && this.players.length > 0) {
      const nextHuman = this.players.find((p) => !p.isBot) || this.players[0];
      nextHuman.isHost = true;
      this.hostId = nextHuman.id;
    }

    return removed;
  }

  addBot() {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }
    const botIndex = this.players.filter((p) => p.isBot).length + 1;
    const botId = `bot_${Math.random().toString(36).substring(2, 7)}`;
    const bot = {
      id: botId,
      username: `Bot ${botIndex}`,
      socketId: null,
      isHost: false,
      isBot: true,
      ready: true,
    };
    this.players.push(bot);
    return bot;
  }

  removeBot(botId) {
    const index = this.players.findIndex((p) => p.id === botId && p.isBot);
    if (index !== -1) {
      return this.players.splice(index, 1)[0];
    }
    return null;
  }

  getSummary() {
    return {
      code: this.code,
      name: this.name,
      hostId: this.hostId,
      hostName: this.players.find((p) => p.id === this.hostId)?.username || 'Host',
      playerCount: this.players.length,
      maxPlayers: this.maxPlayers,
      isPrivate: this.isPrivate,
      status: this.status,
      players: this.players.map((p) => ({
        id: p.id,
        username: p.username,
        isHost: p.isHost,
        isBot: p.isBot,
        ready: p.ready,
      })),
      createdAt: this.createdAt,
    };
  }
}
