import { useEffect, useState } from "react";
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
import { format } from "date-fns";
import { Meet, type MediaItem } from "@shared/schema";
import MediaUpload from "@/components/media-upload";
import { Separator } from "@/components/ui/separator";

const mediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(["photo", "video"]),
  url: z.string(),
  thumbnail: z.string().optional(),
  caption: z.string().optional(),
  uploadedAt: z.string(),
});

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
  media: z.array(mediaItemSchema).optional(),
});

interface EditMeetFormProps {
  meet: Meet;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export default function EditMeetForm({ meet, onSubmit, isLoading }: EditMeetFormProps) {
  // Format the date as YYYY-MM-DD for the input field
  const formatDateForInput = (dateString: string | Date) => {
    // Parse date string consistently to avoid timezone issues
    const date = typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/) 
      ? new Date(`${dateString}T00:00:00`)
      : new Date(dateString);
      
    return format(date, "yyyy-MM-dd");
  };

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(meet.media ?? []);

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
      media: meet.media ?? [],
    },
  });

  useEffect(() => {
    setMediaItems(meet.media ?? []);
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
      media: meet.media ?? [],
    });
  }, [meet, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      media: mediaItems,
    });
  };

  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg font-medium text-primary">Edit Meet</DialogTitle>
        <DialogDescription className="text-gray-500 text-sm mt-1">
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="resize-none border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    placeholder="e.g., 2 hours, 45 minutes" 
                    className="border-accent focus-visible:ring-offset-0 focus-visible:ring-1 bg-white"
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
                    <SelectTrigger className="border-accent focus:ring-offset-0 focus:ring-1 bg-white">
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
          
          {/* Media Upload Section */}
          <div className="pt-2">
            <Separator className="mb-4" />
            <div className="mb-3">
              <FormLabel className="text-sm font-medium">Photos & Videos</FormLabel>
              <p className="text-xs text-gray-500 mt-1">Add photos and videos from this meet</p>
            </div>
            <MediaUpload 
              meetId={meet.id}
              existingMedia={mediaItems}
              onMediaUpdate={(updated) => {
                setMediaItems(updated);
                form.setValue("media", updated);
              }}
              isEditing={true}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-black py-2 h-auto rounded shadow-none transition-all hover:shadow-md mt-3 font-medium mb-2"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </>
  );
}
