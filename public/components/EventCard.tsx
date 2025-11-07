import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import type { PairingEvent } from "@/types/events";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import PearButton from "./PearButton";
import { useRouter } from "next/navigation";

export default function EventCard({ event }: { event: PairingEvent }) {
  const router = useRouter();
  const startDate = new Date(event.start_date ?? event.end_date);
  const endDate = new Date(event.end_date);

  const timeUntilEvent = isPast(endDate)
    ? "Event has ended"
    : formatDistanceToNow(endDate, { addSuffix: true });

  const formattedDate = format(startDate, "MMM d, yyyy");
  const formattedTime = format(startDate, "h:mm a");

  const handleViewDetails = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <Card className="group flex flex-col h-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-[#C3DD90] border-0 overflow-hidden hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <Image
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          src="/event_image.png"
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />

        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Clock className="w-3 h-3" />
            {timeUntilEvent}
          </div>
        </div>

      </div>

      <div className="flex flex-col grow p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-xl font-bold line-clamp-2 text-gray-900 group-hover:text-pear-3 transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 font-medium">
            {event.organization_name}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 grow">
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 pt-3 mt-auto">
          <PearButton
            text="View Details"
            onClick={handleViewDetails}
            className="w-full"
          />
        </CardFooter>
      </div>
    </Card>
  );
}
