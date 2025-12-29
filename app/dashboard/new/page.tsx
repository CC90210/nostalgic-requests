import { EventForm } from "@/components/dashboard/event-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const dynamic = 'force-dynamic';

export default function NewEventPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Create New Event</h2>
        <p className="text-muted-foreground">
          Fill in the details below to generate a new request portal and QR code.
        </p>
      </div>
      <EventForm />
    </div>
  )
}
