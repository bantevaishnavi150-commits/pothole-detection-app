import { auth, signOut } from '../lib/firebase';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { LogOut, User, History, LayoutDashboard, Construction } from 'lucide-react';

export default function Navbar() {
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-brand-yellow text-brand-blue px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <Construction className="w-8 h-8" />
        <h1 className="text-xl font-black uppercase tracking-tighter">
          Road Damage Detection using AI
        </h1>
      </div>

      <div className="hidden md:flex items-center space-x-8 font-semibold uppercase text-sm">
        <a href="#" className="hover:opacity-70 transition-opacity">Reports</a>
        <a href="#" className="hover:opacity-70 transition-opacity">Dashboard</a>
        <a href="#" className="hover:opacity-70 transition-opacity">Last Result</a>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="relative h-10 w-auto flex items-center space-x-2 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-full px-4">
              <span className="font-bold">{user?.displayName || 'User'}</span>
              <Avatar className="h-8 w-8 border-2 border-brand-blue">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-brand-blue text-white">
                  {user?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-card text-white border-white/10" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              History
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={handleLogout} variant="destructive" className="hidden sm:flex bg-brand-blue hover:bg-brand-blue/90 text-white font-bold">
          Logout
        </Button>
      </div>
    </nav>
  );
}
