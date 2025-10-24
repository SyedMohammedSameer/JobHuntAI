import { Search, Moon, Sun, User, Bell, LogOut, Settings, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
}

export function Navbar({ onThemeToggle, isDark, onNavigate, isAuthenticated, onSidebarToggle, showSidebarToggle }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6 gap-2 sm:gap-4">
        {/* Sidebar Toggle (Mobile & Desktop) */}
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo */}
        <button
          onClick={() => onNavigate(isAuthenticated ? "dashboard" : "landing")}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#34d399] to-[#10b981] flex items-center justify-center">
            <span className="text-white text-sm">AI</span>
          </div>
          <span className="hidden sm:inline">AI Job Hunt</span>
        </button>

        {/* Search Bar */}
        {isAuthenticated && (
          <div className="hidden md:flex flex-1 max-w-xl relative mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs, companies..."
              className="pl-10 bg-input-background border-0 w-full"
            />
          </div>
        )}

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onThemeToggle}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-[#34d399] to-[#10b981] text-white">
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate("profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate("landing")}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onNavigate("login")}>
                Log In
              </Button>
              <Button onClick={() => onNavigate("signup")}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
