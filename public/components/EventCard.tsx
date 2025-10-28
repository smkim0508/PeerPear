import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Image from "next/image"

export default function EventCard() {
    return (
        <Card className="flex bg-[#C3DD90] hover:bg-[#B5D07E] m-4">
            <CardTitle className="pl-4">My Event | ASA</CardTitle>
            <CardDescription className="pl-4">This is a sample description of my event.</CardDescription>
            <CardContent className="flex items-center">
                <Image className="rounded-sm" src="/event_image.png" alt="Event Card" width={300} height={200} />
            </CardContent>
            <CardFooter className="gap-4">
                <p>Time to event: 12:00 </p>
                <button className="inline-flex items-center bg-green text-[#1a1a1a] px-5 py-3 rounded-lg text-base font-bold no-underline cursor-pointer border-none transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:brightness-105 hover:-translate-y-1">
                    Information
                </button>

            </CardFooter>
        </Card>
    )
}