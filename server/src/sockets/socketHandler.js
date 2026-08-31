import { roomManager } from '../services/roomManager.js';
import { gameEngine } from '../services/gameEngine.js';

export function setupSocketHandlers(io) {
  // Connect gameEngine broadcasting to Socket.IO
  gameEngine.setBroadcastCallback((roomCode, event, data) => {
    io.to(roomCode).emit(event, data);

    // If it's a game update, also emit private hand states to each connected player
    if (event === 'game_update') {
      const game = gameEngine.getGame(roomCode);
      const room = roomManager.getRoom(roomCode);
      if (game && room) {
        for (const p of room.players) {
          if (p.socketId && !p.isBot) {
            const privateState = game.getState(p.id);
            io.to(p.socketId).emit('player_state', privateState);
          }
        }
      }
    }
  });

  io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);

    // Join Room
    socket.on('join_room', ({ roomCode, user }) => {
      try {
        if (!roomCode || !user) {
          socket.emit('error_msg', 'Invalid join request');
          return;
        }

        const cleanCode = roomCode.toString().trim().toUpperCase();
        const room = roomManager.getRoom(cleanCode);

        if (!room) {
          socket.emit('error_msg', `Room ${cleanCode} not found.`);
          return;
        }

        const { player } = roomManager.joinRoom(cleanCode, {
          id: user.id,
          username: user.username,
          socketId: socket.id,
        });

        socket.join(cleanCode);
        socket.emit('joined_room_success', {
          room: room.getSummary(),
          player,
        });

        // Broadcast room updated to others in the room
        io.to(cleanCode).emit('room_updated', room.getSummary());

        // If game is already active, send current game state
        const game = gameEngine.getGame(cleanCode);
        if (game) {
          socket.emit('player_state', game.getState(user.id));
        }
      } catch (err) {
        socket.emit('error_msg', err.message || 'Failed to join room');
      }
    });

    // Add Bot
    socket.on('add_bot', ({ roomCode, userId }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      if (room.hostId !== userId) {
        socket.emit('error_msg', 'Only the room host can add bots.');
        return;
      }

      try {
        room.addBot();
        io.to(roomCode).emit('room_updated', room.getSummary());
      } catch (err) {
        socket.emit('error_msg', err.message);
      }
    });

    // Remove Bot / Player
    socket.on('remove_player', ({ roomCode, targetId, userId }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      if (room.hostId !== userId && targetId !== userId) {
        socket.emit('error_msg', 'Not authorized to remove player.');
        return;
      }

      const isBot = room.players.find((p) => p.id === targetId)?.isBot;
      if (isBot) {
        room.removeBot(targetId);
      } else {
        roomManager.leaveRoom(targetId);
      }

      io.to(roomCode).emit('room_updated', room.getSummary());
    });

    // Start Game
    socket.on('start_game', ({ roomCode, userId }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        socket.emit('error_msg', 'Room not found');
        return;
      }

      if (room.hostId !== userId) {
        socket.emit('error_msg', 'Only the host can start the game');
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error_msg', 'Need at least 2 players to start! Add a bot or invite a friend.');
        return;
      }

      room.status = 'playing';
      const game = gameEngine.createGame(roomCode, room.players);

      io.to(roomCode).emit('game_started', {
        roomCode,
        topCard: game.topCard,
        activeColor: game.activeColor,
        currentTurnPlayerId: game.getCurrentPlayer()?.id,
      });

      // Send each player their private hand
      for (const p of room.players) {
        if (p.socketId && !p.isBot) {
          const privateState = game.getState(p.id);
          io.to(p.socketId).emit('player_state', privateState);
        }
      }

      io.to(roomCode).emit('room_updated', room.getSummary());
    });

    // Play Card
    socket.on('play_card', ({ roomCode, userId, cardId, chosenColor }) => {
      const game = gameEngine.getGame(roomCode);
      if (!game) {
        socket.emit('error_msg', 'Game not active.');
        return;
      }

      const result = game.playCard(userId, cardId, chosenColor);
      if (!result.success) {
        socket.emit('error_msg', result.error);
        return;
      }

      gameEngine.broadcastGameState(roomCode);

      if (result.winner) {
        const room = roomManager.getRoom(roomCode);
        if (room) room.status = 'finished';
        io.to(roomCode).emit('game_over', { winner: result.winner });
      } else {
        gameEngine.scheduleNextAction(roomCode);
      }
    });

    // Draw Card
    socket.on('draw_card', ({ roomCode, userId }) => {
      const game = gameEngine.getGame(roomCode);
      if (!game) {
        socket.emit('error_msg', 'Game not active.');
        return;
      }

      const result = game.drawCard(userId);
      if (!result.success) {
        socket.emit('error_msg', result.error);
        return;
      }

      gameEngine.broadcastGameState(roomCode);

      if (result.autoSkipped) {
        gameEngine.scheduleNextAction(roomCode);
      }
    });

    // Pass Turn
    socket.on('pass_turn', ({ roomCode, userId }) => {
      const game = gameEngine.getGame(roomCode);
      if (!game) {
        socket.emit('error_msg', 'Game not active.');
        return;
      }

      const result = game.passTurn(userId);
      if (!result.success) {
        socket.emit('error_msg', result.error);
        return;
      }

      gameEngine.broadcastGameState(roomCode);
      gameEngine.scheduleNextAction(roomCode);
    });

    // Call UNO
    socket.on('call_uno', ({ roomCode, userId }) => {
      const game = gameEngine.getGame(roomCode);
      if (!game) return;

      const result = game.callUno(userId);
      if (result.success) {
        io.to(roomCode).emit('uno_called', { playerId: userId, username: result.username });
        gameEngine.broadcastGameState(roomCode);
      } else {
        socket.emit('error_msg', result.error);
      }
    });

    // Catch UNO
    socket.on('catch_uno', ({ roomCode, callerId, targetPlayerId }) => {
      const game = gameEngine.getGame(roomCode);
      if (!game) return;

      const result = game.catchUno(callerId, targetPlayerId);
      if (result.success) {
        const callerName = game.players.find((p) => p.id === callerId)?.username || 'Someone';
        io.to(roomCode).emit('uno_caught', { catcher: callerName, target: result.targetName });
        gameEngine.broadcastGameState(roomCode);
      } else {
        socket.emit('error_msg', result.error);
      }
    });

    // Return to Lobby / Play Again
    socket.on('restart_to_lobby', ({ roomCode, userId }) => {
      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      if (room.hostId !== userId) {
        socket.emit('error_msg', 'Only the host can reset the game.');
        return;
      }

      gameEngine.endGame(roomCode);
      room.status = 'lobby';

      io.to(roomCode).emit('returned_to_lobby', { room: room.getSummary() });
      io.to(roomCode).emit('room_updated', room.getSummary());
    });

    // Create Instant Singleplayer Game vs Bots
    socket.on('create_singleplayer_game', ({ user, botCount = 2 }) => {
      try {
        if (!user) {
          socket.emit('error_msg', 'User information required to start singleplayer match.');
          return;
        }

        const count = Math.max(1, Math.min(3, parseInt(botCount, 10) || 2));
        const room = roomManager.createRoom({
          name: `${user.username}'s Solo Match`,
          maxPlayers: count + 1,
          hostId: user.id,
          hostUsername: user.username,
          isPrivate: true,
        });

        const { player } = roomManager.joinRoom(room.code, {
          id: user.id,
          username: user.username,
          socketId: socket.id,
        });

        socket.join(room.code);

        // Add requested bots
        for (let i = 0; i < count; i++) {
          room.addBot();
        }

        room.status = 'playing';
        const game = gameEngine.createGame(room.code, room.players);

        socket.emit('singleplayer_game_started', {
          roomCode: room.code,
          room: room.getSummary(),
          player,
        });

        io.to(room.code).emit('game_started', {
          roomCode: room.code,
          topCard: game.topCard,
          activeColor: game.activeColor,
          currentTurnPlayerId: game.getCurrentPlayer()?.id,
        });

        // Send private player state
        socket.emit('player_state', game.getState(user.id));
      } catch (err) {
        socket.emit('error_msg', err.message || 'Failed to start singleplayer game.');
      }
    });

    // Chat / Emote
    socket.on('send_chat', ({ roomCode, message, user }) => {
      if (!message || !roomCode) return;
      io.to(roomCode).emit('chat_message', {
        id: Math.random().toString(36).substring(2, 9),
        sender: user?.username || 'Player',
        senderId: user?.id,
        text: message.substring(0, 150),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // Quick Live Reaction Emote
    socket.on('send_reaction', ({ roomCode, emoji, user }) => {
      if (!emoji || !roomCode) return;
      io.to(roomCode).emit('player_reaction', {
        id: Math.random().toString(36).substring(2, 9),
        sender: user?.username || 'Player',
        senderId: user?.id,
        emoji,
      });
    });

    // Leave Room
    socket.on('leave_room', ({ userId }) => {
      const result = roomManager.leaveRoom(userId);
      if (result && result.room) {
        socket.leave(result.room.code);
        io.to(result.room.code).emit('room_updated', result.room.getSummary());
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const result = roomManager.handleSocketDisconnect(socket.id);
      if (result && result.room) {
        io.to(result.room.code).emit('room_updated', result.room.getSummary());
      }
    });
  });
}
