"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, CheckCircle2, Minus, Plus } from "lucide-react";

interface DraftInvoiceItem {
  id: string;
  serviceName: string;
  priceAtPurchase: number;
  quantity: number;
}

interface DraftInvoiceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onUpdated: () => void;
}

export function DraftInvoiceEditDialog({
  isOpen,
  onClose,
  invoiceId,
  onUpdated,
}: DraftInvoiceEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [items, setItems] = useState<DraftInvoiceItem[]>([]);
  const [offer, setOffer] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoice(invoiceId);
    }
  }, [isOpen, invoiceId]);

  const fetchInvoice = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setItems(
          data.data.invoiceItems.map((item: any) => ({
            id: item.id,
            serviceName: item.serviceName,
            priceAtPurchase: item.priceAtPurchase,
            quantity: item.quantity,
          })),
        );
        setOffer(data.data.offer || 0);
        setNotes(data.data.notes || "");
      } else {
        throw new Error(data.error || "Failed to load invoice");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subTotal = items.reduce(
    (sum, item) => sum + item.priceAtPurchase * item.quantity,
    0,
  );
  const discount = (subTotal * offer) / 100;
  const total = subTotal - discount;

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const handleSave = async () => {
    if (!invoiceId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: total,
          alreadyPaid: 0,
          due: total,
          paymentAmount: 0,
          date: new Date().toISOString(),
          invoiceItems: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          offer,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Saved", description: "Draft invoice updated" });
        onUpdated();
      } else {
        throw new Error(data.error || "Failed to update invoice");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!invoiceId) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/finalize`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Invoice Finalized",
          description: `Invoice is now ${data.data.status}`,
        });
        onUpdated();
        onClose();
      } else {
        throw new Error(data.error || "Failed to finalize invoice");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to finalize invoice",
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Draft Invoice</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 border rounded-md p-2"
                >
                  <div>
                    <p className="text-sm font-medium">{item.serviceName}</p>
                    <p className="text-xs text-gray-500">
                      ₹{item.priceAtPurchase.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Discount (%)</Label>
              <Input
                id="offer"
                type="number"
                min="0"
                max="100"
                value={offer}
                onChange={(e) => setOffer(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Remarks</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="text-sm border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving || finalizing}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving || finalizing || loading}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleFinalize}
              disabled={saving || finalizing || loading}
            >
              {finalizing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Finalize Invoice
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
