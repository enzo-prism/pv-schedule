import { useState } from "react";
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
import { format } from "date-fns";
import { DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";

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
});

interface AddMeetFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export default function AddMeetForm({ onSubmit, isLoading }: AddMeetFormProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: today,
      location: "",
      description: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg font-medium text-primary">Add New Meet</DialogTitle>
        <DialogDescription className="text-gray-500 text-sm mt-1">
          Enter the details for the new track and field meet
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 pt-2">
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
                    min={today}
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
          
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-black py-2 h-auto rounded shadow-none transition-all hover:shadow-md mt-3 font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Meet"}
          </Button>
        </form>
      </Form>
    </>
  );
}
