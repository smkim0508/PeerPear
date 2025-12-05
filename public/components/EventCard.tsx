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
import { Calendar, Clock, CheckCircle } from "lucide-react";
import PearButton from "./PearButton";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: PairingEvent;
  isRegistered?: boolean;
}

export default function EventCard({ event, isRegistered = false }: EventCardProps) {
  const router = useRouter();

  const endDate = event.end_date ? new Date(event.end_date) : null;
  const hasEnded =
    (endDate ? isPast(endDate) : false) ||
    (event.status !== "STARTED" && event.status !== "NOT_STARTED");

  const statusLabel = (() => {
    if (event.status === "STARTED" && !hasEnded) return "Active";
    if (event.status === "NOT_STARTED") return "Not Started";
    if (event.status === "PAIRING_PUBLISHED") return "Results Published";
    if (event.status === "TERMINATED" || hasEnded) return "Closed";
    return "Unknown";
  })();

  const badgeColor = (() => {
    switch (statusLabel) {
      case "Active":
        return "bg-green text-nav-dark border-green";
      case "Not Started":
        return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "Results Published":
        return "bg-blue-100 text-blue-700 border-blue-400";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  })();

  const timeUntilEvent = (() => {
    if (event.status === "NOT_STARTED") {
      return "Not started yet";
    }
    if (event.status === "STARTED" && !hasEnded && endDate) {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    }
    if (event.status === "PAIRING_PUBLISHED") {
      return "Results published";
    }
    if (event.status === "TERMINATED" || hasEnded) {
      return "Program has ended";
    }
    return "TBA";
  })();

  const formattedDate = endDate ? format(endDate, "MMM d, yyyy") : "TBA";

  const handleViewDetails = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <Card className="group flex flex-col h-full rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white border overflow-hidden hover:-translate-y-0.5">
      <div className="relative h-48 overflow-hidden">
        <Image
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          src={event.image_url || "/event_image.png"}
          alt={event.title}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />

        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Clock className="w-3 h-3" />
            {timeUntilEvent}
          </div>
        </div>

        {isRegistered && (
          <div className="absolute top-3 right-3 bg-primary/10 backdrop-blur-sm px-3 py-1 rounded-full shadow">
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle className="w-3 h-3" />
              Registered
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col grow p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-xl font-semibold line-clamp-2 text-gray-900">
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
          </div>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}`}>
            {statusLabel}
          </div>
        </CardContent>

        <CardFooter className="p-0 pt-3 mt-auto">
          <PearButton
            text="View Details"
            onClick={handleViewDetails}
            className="w-full cursor-pointer"
          />
        </CardFooter>
      </div>
    </Card>
  );
}
