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
import { X } from "lucide-react";
import { DialogTitle, DialogHeader } from "@/components/ui/dialog";

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
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">Add New Meet</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meet Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., State Championships" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    min={today}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Central Stadium, Springfield" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any additional details about the meet" 
                    className="resize-none"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Meet"}
          </Button>
        </form>
      </Form>
    </>
  );
}
