import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DeleteStockModal({ open, onClose, onConfirm, stockName }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 overflow-hidden max-w-sm">
        <div className="bg-primary text-primary-foreground px-4 py-3">
          <DialogTitle className="text-base font-bold">Delete Stock</DialogTitle>
        </div>

        <div className="p-5">
          <p className="text-sm mb-1.5">
            Are you sure you want to delete{" "}
            <strong className="font-bold">{stockName}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Warning:</strong> Any unsold shares for this stock will also be removed.
          </p>
        </div>

        <Separator />

        <DialogFooter className="px-5 pb-4 pt-3 gap-2">
          <Button variant="outline" onClick={onClose} className="min-w-[80px]">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="min-w-[80px]">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DeleteStockModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  stockName: PropTypes.string.isRequired,
};
