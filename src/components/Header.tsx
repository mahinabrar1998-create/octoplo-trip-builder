import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-5 px-6 md:px-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Octoplo
          </span>
        </Link>

        {/* Left Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a 
            href="#how-it-works" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a 
            href="#features" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
        </nav>

        {/* Right Navigation */}
        <Link 
          to="/saved" 
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
        >
          <Bookmark className="w-4 h-4" />
          Saved Plans
        </Link>
      </div>
    </header>
  );
};

export default Header;
