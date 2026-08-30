import { Room } from '../models/Room.js';

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> Room
    this.socketToPlayer = new Map(); // socketId -> { playerId, roomCode }
    this.playerToRoom = new Map(); // playerId -> roomCode
  }

  generateRoomCode() {
    let code;
    let attempts = 0;
    do {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  createRoom({ name, maxPlayers = 4, hostId, hostUsername, isPrivate = false, customCode = null }) {
    const code = customCode ? customCode.trim().toUpperCase() : this.generateRoomCode();

    if (this.rooms.has(code)) {
      throw new Error(`Room with code ${code} already exists.`);
    }

    const room = new Room({
      code,
      name: name || `Room ${code}`,
      maxPlayers,
      hostId,
      hostUsername,
      isPrivate,
    });

    this.rooms.set(code, room);
    if (hostId) {
      this.playerToRoom.set(hostId, code);
    }
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toString().trim().toUpperCase()) || null;
  }

  getPublicRooms() {
    const list = [];
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.status === 'lobby') {
        list.push(room.getSummary());
      }
    }
    return list;
  }

  joinRoom(code, { id, username, socketId }) {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error(`Room ${code} not found`);
    }

    const player = room.addPlayer({ id, username, socketId });
    this.playerToRoom.set(id, room.code);
    if (socketId) {
      this.socketToPlayer.set(socketId, { playerId: id, roomCode: room.code });
    }
    return { room, player };
  }

  leaveRoom(playerId) {
    const code = this.playerToRoom.get(playerId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) {
      this.playerToRoom.delete(playerId);
      return null;
    }

    const removed = room.removePlayer(playerId);
    this.playerToRoom.delete(playerId);

    // If room is empty or only bots remain, clean up room
    const humanCount = room.players.filter((p) => !p.isBot).length;
    if (humanCount === 0) {
      this.rooms.delete(code);
    }

    return { room, removedPlayer: removed };
  }

  handleSocketDisconnect(socketId) {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return null;

    const { playerId, roomCode } = mapping;
    this.socketToPlayer.delete(socketId);

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.socketId = null;
    }

    return { room, playerId };
  }
}

export const roomManager = new RoomManager();
