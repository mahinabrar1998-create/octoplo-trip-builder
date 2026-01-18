// Shared trip types used across Generate and Build modes

export type Weather = {
  condition: "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy";
  highTemp: number;
  lowTemp: number;
  note: string;
};

export type TimeBlock = {
  time: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: string;
  category: "food" | "activity" | "transport" | "accommodation" | "free-time";
  transportNote?: string;
  weatherConsideration?: string;
};

export type Day = {
  dayNumber: number;
  date: string;
  weather: Weather;
  blocks: TimeBlock[];
};

export type FlightInfo = {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  estimatedCost: string;
  class: string;
  note: string;
};

export type Flights = {
  outbound: FlightInfo;
  return: FlightInfo;
};

export type HotelType = {
  name: string;
  address: string;
  neighborhood: string;
  starRating: number;
  estimatedCostPerNight: string;
  totalEstimatedCost: string;
  amenities: string[];
  whyRecommended: string;
  checkIn: string;
  checkOut: string;
  bookingTip: string;
};

export type TripPlan = {
  name: string;
  theme: string;
  summary: string;
  flights?: Flights;
  hotel?: HotelType;
  days: Day[];
  estimatedTotalCost: string;
  highlights: string[];
  packingTips?: string[];
};

// Default empty values for creation mode
export const emptyFlightInfo: FlightInfo = {
  airline: "",
  flightNumber: "",
  departure: "",
  arrival: "",
  duration: "",
  estimatedCost: "",
  class: "Economy",
  note: "",
};

export const emptyFlights: Flights = {
  outbound: { ...emptyFlightInfo },
  return: { ...emptyFlightInfo },
};

export const emptyHotel: HotelType = {
  name: "",
  address: "",
  neighborhood: "",
  starRating: 3,
  estimatedCostPerNight: "",
  totalEstimatedCost: "",
  amenities: [],
  whyRecommended: "",
  checkIn: "3:00 PM",
  checkOut: "11:00 AM",
  bookingTip: "",
};

export const emptyTimeBlock: TimeBlock = {
  time: "",
  endTime: "",
  title: "",
  description: "",
  location: "",
  estimatedCost: "",
  category: "activity",
};

export const emptyDay = (dayNumber: number, date: string): Day => ({
  dayNumber,
  date,
  weather: {
    condition: "sunny",
    highTemp: 75,
    lowTemp: 60,
    note: "",
  },
  blocks: [],
});
