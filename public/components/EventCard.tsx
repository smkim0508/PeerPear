import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import type { PairingEvent } from "@/types/events";
import { formatDistanceToNow, isPast } from "date-fns";

export default function EventCard({ event }: { event: PairingEvent }) {
  const timeUntilEvent = isPast(new Date(event.end_date))
    ? "Event has ended"
    : formatDistanceToNow(new Date(event.end_date), { addSuffix: true });

  return (
    <Card className="flex flex-col bg-[#C3DD90] hover:bg-[#B5D07E] transition-colors duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold line-clamp-2">
          {event.title} - {event.organization_name}
        </CardTitle>
        <CardDescription className="text-sm text-gray-700 line-clamp-3">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grow flex items-center justify-center p-4">
        <div className="relative w-full aspect-video">

          <Image
            className="rounded-sm object-cover"
            src="/event_image.png"
            alt="Event Card"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <p className="text-sm text-gray-600 text-center">
          Time to event: {timeUntilEvent}
        </p>
        <button className="w-full inline-flex items-center justify-center bg-green text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-bold no-underline cursor-pointer border-none transition-all duration-300 hover:scale-105 hover:shadow-lg hover:brightness-105">
          Information
        </button>
      </CardFooter>
    </Card>
  );
}
