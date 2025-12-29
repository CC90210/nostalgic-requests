import { EventForm } from "@/components/dashboard/event-form"

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Event</h2>
        <p className="text-muted-foreground">
          Set up a new event portal to start accepting requests.
        </p>
      </div>
      <EventForm />
    </div>
  )
}
