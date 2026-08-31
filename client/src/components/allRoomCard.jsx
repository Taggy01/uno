import { useState, useEffect } from "react";
import { Card, Typography, Button, Avatar, Chip } from "@heroui/react";
import { ArrowRotateRight, ArrowRight, Persons } from '@gravity-ui/icons';
import { useNavigate } from "react-router-dom";
import { getUserGradient } from "../Gradient/gradient";

export default function AllRoomCard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full mt-6">
      <Card className="w-full border border-neutral-800 bg-neutral-900 rounded-3xl p-4 shadow-xl text-left">
        <Card.Header className="flex flex-row items-center justify-between pb-2">
          <div>
            <Card.Title className="text-xl font-bold flex items-center gap-2 text-white">
              <Persons className="w-5 h-5 text-blue-400" />
              Public Rooms
            </Card.Title>
            <Card.Description className="text-neutral-400 text-sm">
              Discover and join active public multiplayer matches
            </Card.Description>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 h-auto"
            disabled={loading}
            onClick={fetchRooms}
          >
            <ArrowRotateRight className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </Card.Header>

        <Card.Content className="pt-4">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
                <Persons className="w-6 h-6" />
              </div>
              <Typography.Heading level={5} className="font-semibold text-neutral-300">
                No Public Rooms Right Now
              </Typography.Heading>
              <Typography className="text-sm text-neutral-500 mt-1 max-w-sm">
                Be the first to create a room and play with friends or AI bots!
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const gradient = getUserGradient(room.hostId || 'host');
                const isFull = room.playerCount >= room.maxPlayers;

                return (
                  <Card
                    key={room.code}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 hover:border-neutral-500 transition-all shadow-md group text-left"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                          {room.name}
                        </h4>
                        <Chip size="sm" className="px-2 py-0.5 text-xs font-mono font-bold bg-neutral-700 text-blue-300 rounded-full border border-blue-400/20">
                          #{room.code}
                        </Chip>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
                        <Avatar
                          name={room.hostName || 'Host'}
                          className="w-5 h-5 text-[10px] text-white"
                          style={{ background: gradient }}
                        />
                        <span className="text-xs truncate">Host: {room.hostName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-700/60 mt-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className={isFull ? 'text-rose-400' : 'text-neutral-300'}>
                          {room.playerCount}/{room.maxPlayers} Players
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant={isFull ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isFull}
                        onClick={() => navigate(`/lobby/${room.code}`)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer h-auto ${
                          isFull
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        }`}
                      >
                        <span>{isFull ? 'Full' : 'Join'}</span>
                        {!isFull && <ArrowRight className="w-3 h-3" />}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}