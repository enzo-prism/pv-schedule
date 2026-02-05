import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Meet } from "@shared/schema";
import { toYmdDateString } from "@shared/dates";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Meet name must be at least 2 characters.",
  }),
  date: z.string().min(1, {
    message: "Please select a date for the meet.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z.string().optional(),
  heightCleared: z.string().optional(),
  poleUsed: z.string().optional(),
  deepestTakeoff: z.string().optional(),
  place: z.string().optional(),
  link: z.string().optional(),
  driveTime: z.string().optional(),
  registrationStatus: z.string().optional(),
});

interface EditMeetFormProps {
  meet: Meet;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export default function EditMeetForm({ meet, onSubmit, isLoading }: EditMeetFormProps) {
  // Format the date as YYYY-MM-DD for the input field
  const formatDateForInput = (dateString: string | Date) => {
    return toYmdDateString(dateString) ?? "";
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: meet.name,
      date: formatDateForInput(meet.date),
      location: meet.location,
      description: meet.description || "",
      heightCleared: meet.heightCleared || "",
      poleUsed: meet.poleUsed || "",
      deepestTakeoff: meet.deepestTakeoff || "",
      place: meet.place || "",
      link: meet.link || "",
      driveTime: meet.driveTime || "",
      registrationStatus: meet.registrationStatus || "not registered",
    },
  });

  useEffect(() => {
    form.reset({
      name: meet.name,
      date: formatDateForInput(meet.date),
      location: meet.location,
      description: meet.description || "",
      heightCleared: meet.heightCleared || "",
      poleUsed: meet.poleUsed || "",
      deepestTakeoff: meet.deepestTakeoff || "",
      place: meet.place || "",
      link: meet.link || "",
      driveTime: meet.driveTime || "",
      registrationStatus: meet.registrationStatus || "not registered",
    });
  }, [meet, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg font-medium text-foreground">Edit Meet</DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm mt-1">
          Update the details for this track and field meet
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 pt-2 overflow-y-auto max-h-[65vh] pr-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Meet Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., State Championships" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    autoCapitalize="words"
                    autoComplete="off"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Central Stadium, Springfield" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    autoCapitalize="words"
                    autoComplete="off"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any additional details about the meet" 
                    className="resize-none border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="heightCleared"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Height Cleared (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 2.10m" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    inputMode="decimal"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="poleUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Pole Used (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Carbon Fiber 4.5m" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    autoCapitalize="words"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deepestTakeoff"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Deepest Takeoff (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 3.8m" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    inputMode="decimal"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="place"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Place/Ranking (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 1st, 2nd, 3rd" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    inputMode="numeric"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Meet Link (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., https://athletic.net/meet/12345" 
                    type="url"
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    inputMode="url"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="driveTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Drive Time to Meet (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 2:45" 
                    className="border-border bg-background/40 focus-visible:ring-1 focus-visible:ring-ring"
                    inputMode="numeric"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="registrationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Registration Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-border bg-background/40 focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="Select registration status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not registered">Not Registered</SelectItem>
                    <SelectItem value="contacted director">Contacted Director</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-foreground text-background hover:bg-foreground/90 py-2 h-auto rounded shadow-none transition-colors mt-3 font-medium mb-2"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </>
  );
}
