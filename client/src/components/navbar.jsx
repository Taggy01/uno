import { Link, Typography, Dropdown, Button, Separator, Avatar } from "@heroui/react";
import { ArrowRightFromSquare, House, SquarePlus, Person } from '@gravity-ui/icons';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserGradient } from "../Gradient/gradient";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const gradient = getUserGradient(user?.id || 'guest_123');

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-800 backdrop-blur-md sticky top-0 z-40 bg-neutral-900/80">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md">
          <span className="font-extrabold text-white text-base tracking-wider">UNO</span>
        </div>
        <Typography.Heading level={4} className="font-extrabold tracking-tight text-white">
          UNO Online
        </Typography.Heading>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs transition-colors cursor-pointer"
          onClick={() => navigate('/')}
        >
          <House className="w-4 h-4" />
          <span>Home</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Dropdown>
          <Button variant="secondary" className="gap-2 pr-4 pl-2 rounded-full border border-neutral-700/60 hover:border-neutral-500">
            <Avatar
              name={user?.username || 'User'}
              className="w-7 h-7 text-xs text-white font-bold"
              style={{ background: gradient }}
            />
            <span className="font-semibold text-sm max-w-[120px] truncate">
              {user?.username || 'Player'}
            </span>
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="user-info" textValue={user?.username}>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm">{user?.username}</span>
                  <span className="text-xs text-muted">{user?.isGuest ? 'Guest Player' : user?.email}</span>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="Switch/Log Out"
                className="justify-between text-danger hover:bg-danger/10"
                onAction={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <span>{user?.isGuest ? 'Log In / Register' : 'Log Out'}</span>
                <ArrowRightFromSquare />
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}