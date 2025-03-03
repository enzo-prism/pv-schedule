import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteConfirmation({
  isOpen,
  onCancel,
  onConfirm,
  title = "Delete Meet",
  description = "Are you sure you want to delete this meet? This action cannot be undone."
}: DeleteConfirmationProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="border-accent hover:bg-accent/10 hover:text-gray-800"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}