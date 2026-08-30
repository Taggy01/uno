import { roomManager } from '../services/roomManager.js';

export function createRoom(req, res) {
  try {
    const { name, maxPlayers, isPrivate, customCode } = req.body;
    const user = req.user;

    const room = roomManager.createRoom({
      name,
      maxPlayers: Number(maxPlayers) || 4,
      hostId: user.id,
      hostUsername: user.username,
      isPrivate: Boolean(isPrivate),
      customCode,
    });

    return res.status(201).json({
      success: true,
      room: room.getSummary(),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create room',
    });
  }
}

export function getPublicRooms(req, res) {
  try {
    const rooms = roomManager.getPublicRooms();
    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rooms',
    });
  }
}

export function getRoomDetails(req, res) {
  try {
    const { code } = req.params;
    const room = roomManager.getRoom(code);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Check the code and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      room: room.getSummary(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
