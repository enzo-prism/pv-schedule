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

interface AddMeetFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export default function AddMeetForm({ onSubmit, isLoading }: AddMeetFormProps) {
  const today = toYmdDateString(new Date()) ?? "";
  const draftKey = "pv-add-meet-draft";
  const lastLocation =
    typeof window !== "undefined"
      ? window.localStorage.getItem("pv-last-location") ?? ""
      : "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: today,
      location: lastLocation,
      description: "",
      heightCleared: "",
      poleUsed: "",
      deepestTakeoff: "",
      place: "",
      link: "",
      driveTime: "",
      registrationStatus: "not registered",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawDraft = window.localStorage.getItem(draftKey);
    if (!rawDraft) {
      return;
    }
    try {
      const draft = JSON.parse(rawDraft) as Partial<z.infer<typeof formSchema>>;
      form.reset({ ...form.getValues(), ...draft, date: draft.date ?? today });
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [form, today]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const subscription = form.watch((value) => {
      window.localStorage.setItem(draftKey, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg font-medium text-foreground">Add New Meet</DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm mt-1">
          Enter the details for the new track and field meet
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
                    className="bg-card/30"
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
                    min={today}
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    className="resize-none bg-card/30"
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
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    className="bg-card/30"
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
                    <SelectTrigger className="bg-card/30">
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
          
          <Button type="submit" className="w-full mt-3 mb-2" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Meet"}
          </Button>
        </form>
      </Form>
    </>
  );
}
