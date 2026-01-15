import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const popularDestinations = [
  // USA destinations
  { city: "New York", country: "USA", emoji: "🇺🇸" },
  { city: "Los Angeles", country: "USA", emoji: "🇺🇸" },
  { city: "Miami", country: "USA", emoji: "🇺🇸" },
  { city: "San Francisco", country: "USA", emoji: "🇺🇸" },
  { city: "Las Vegas", country: "USA", emoji: "🇺🇸" },
  { city: "Chicago", country: "USA", emoji: "🇺🇸" },
  { city: "Seattle", country: "USA", emoji: "🇺🇸" },
  { city: "Austin", country: "USA", emoji: "🇺🇸" },
  { city: "Nashville", country: "USA", emoji: "🇺🇸" },
  { city: "New Orleans", country: "USA", emoji: "🇺🇸" },
  { city: "Boston", country: "USA", emoji: "🇺🇸" },
  { city: "Denver", country: "USA", emoji: "🇺🇸" },
  { city: "San Diego", country: "USA", emoji: "🇺🇸" },
  { city: "Honolulu", country: "USA", emoji: "🇺🇸" },
  { city: "Maui", country: "USA", emoji: "🇺🇸" },
  { city: "Aspen", country: "USA", emoji: "🇺🇸" },
  { city: "Breckenridge", country: "USA", emoji: "🇺🇸" },
  { city: "Vail", country: "USA", emoji: "🇺🇸" },
  { city: "Park City", country: "USA", emoji: "🇺🇸" },
  { city: "Lake Tahoe", country: "USA", emoji: "🇺🇸" },
  { city: "Yosemite", country: "USA", emoji: "🇺🇸" },
  { city: "Grand Canyon", country: "USA", emoji: "🇺🇸" },
  { city: "Yellowstone", country: "USA", emoji: "🇺🇸" },
  { city: "Zion", country: "USA", emoji: "🇺🇸" },
  { city: "Sedona", country: "USA", emoji: "🇺🇸" },
  { city: "Savannah", country: "USA", emoji: "🇺🇸" },
  { city: "Charleston", country: "USA", emoji: "🇺🇸" },
  { city: "Portland", country: "USA", emoji: "🇺🇸" },
  { city: "Scottsdale", country: "USA", emoji: "🇺🇸" },
  { city: "Key West", country: "USA", emoji: "🇺🇸" },
  { city: "Napa Valley", country: "USA", emoji: "🇺🇸" },
  { city: "Jackson Hole", country: "USA", emoji: "🇺🇸" },
  { city: "Moab", country: "USA", emoji: "🇺🇸" },
  // International destinations
  { city: "Tokyo", country: "Japan", emoji: "🇯🇵" },
  { city: "Paris", country: "France", emoji: "🇫🇷" },
  { city: "London", country: "UK", emoji: "🇬🇧" },
  { city: "Dubai", country: "UAE", emoji: "🇦🇪" },
  { city: "Dhaka", country: "Bangladesh", emoji: "🇧🇩" },
  { city: "Bangkok", country: "Thailand", emoji: "🇹🇭" },
  { city: "Singapore", country: "Singapore", emoji: "🇸🇬" },
  { city: "Barcelona", country: "Spain", emoji: "🇪🇸" },
  { city: "Rome", country: "Italy", emoji: "🇮🇹" },
  { city: "Sydney", country: "Australia", emoji: "🇦🇺" },
  { city: "Istanbul", country: "Turkey", emoji: "🇹🇷" },
  { city: "Seoul", country: "South Korea", emoji: "🇰🇷" },
  { city: "Amsterdam", country: "Netherlands", emoji: "🇳🇱" },
  { city: "Berlin", country: "Germany", emoji: "🇩🇪" },
  { city: "Bali", country: "Indonesia", emoji: "🇮🇩" },
  { city: "Mumbai", country: "India", emoji: "🇮🇳" },
  { city: "Delhi", country: "India", emoji: "🇮🇳" },
  { city: "Cairo", country: "Egypt", emoji: "🇪🇬" },
  { city: "Cape Town", country: "South Africa", emoji: "🇿🇦" },
  { city: "Rio de Janeiro", country: "Brazil", emoji: "🇧🇷" },
  { city: "Buenos Aires", country: "Argentina", emoji: "🇦🇷" },
  { city: "Mexico City", country: "Mexico", emoji: "🇲🇽" },
  { city: "Cancun", country: "Mexico", emoji: "🇲🇽" },
  { city: "Toronto", country: "Canada", emoji: "🇨🇦" },
  { city: "Vancouver", country: "Canada", emoji: "🇨🇦" },
  { city: "Banff", country: "Canada", emoji: "🇨🇦" },
  { city: "Whistler", country: "Canada", emoji: "🇨🇦" },
  { city: "Hong Kong", country: "China", emoji: "🇭🇰" },
  { city: "Kuala Lumpur", country: "Malaysia", emoji: "🇲🇾" },
  { city: "Vienna", country: "Austria", emoji: "🇦🇹" },
  { city: "Prague", country: "Czech Republic", emoji: "🇨🇿" },
  { city: "Athens", country: "Greece", emoji: "🇬🇷" },
  { city: "Lisbon", country: "Portugal", emoji: "🇵🇹" },
  { city: "Dublin", country: "Ireland", emoji: "🇮🇪" },
  { city: "Edinburgh", country: "Scotland", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { city: "Marrakech", country: "Morocco", emoji: "🇲🇦" },
  { city: "Hanoi", country: "Vietnam", emoji: "🇻🇳" },
  { city: "Phuket", country: "Thailand", emoji: "🇹🇭" },
  { city: "Maldives", country: "Maldives", emoji: "🇲🇻" },
  { city: "Santorini", country: "Greece", emoji: "🇬🇷" },
  { city: "Reykjavik", country: "Iceland", emoji: "🇮🇸" },
  { city: "Zurich", country: "Switzerland", emoji: "🇨🇭" },
  { city: "Queenstown", country: "New Zealand", emoji: "🇳🇿" },
];

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

const DestinationAutocomplete = ({ value, onChange }: DestinationAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredDestinations = value.trim()
    ? popularDestinations.filter(
        (dest) =>
          dest.city.toLowerCase().includes(value.toLowerCase()) ||
          dest.country.toLowerCase().includes(value.toLowerCase())
      )
    : popularDestinations.slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string, country: string) => {
    onChange(`${city}, ${country}`);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredDestinations.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredDestinations[highlightedIndex]) {
          const dest = filteredDestinations[highlightedIndex];
          handleSelect(dest.city, dest.country);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="e.g., Tokyo, Japan"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="text-lg py-6 pl-12 text-center rounded-xl border-2 focus:border-primary"
        />
      </div>

      {isOpen && filteredDestinations.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {filteredDestinations.map((dest, index) => (
            <button
              key={`${dest.city}-${dest.country}`}
              onClick={() => handleSelect(dest.city, dest.country)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                highlightedIndex === index
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className="text-xl">{dest.emoji}</span>
              <div>
                <span className="font-medium">{dest.city}</span>
                <span className="text-muted-foreground">, {dest.country}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && value.trim() && filteredDestinations.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground">
          No matching destinations. You can still use "{value}" as your destination.
        </div>
      )}
    </div>
  );
};

export default DestinationAutocomplete;
