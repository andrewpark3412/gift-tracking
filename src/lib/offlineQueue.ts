import { supabase } from "./supabaseClient";

export type QueuedOperation = {
  id: string;
  timestamp: number;
  type: "insert" | "update" | "delete";
  table: string;
  data?: any;
  recordId?: string;
};

const QUEUE_KEY = "offline_operations_queue";

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline queue:", error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  add(operation: Omit<QueuedOperation, "id" | "timestamp">) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    this.queue.push(queuedOp);
    this.saveQueue();
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.processing = true;
    const failures: QueuedOperation[] = [];

    for (const operation of this.queue) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error("Failed to execute queued operation:", error);
        failures.push(operation);
      }
    }

    // Keep failed operations in queue
    this.queue = failures;
    this.saveQueue();
    this.processing = false;

    // Dispatch event to notify listeners
    if (failures.length === 0) {
      window.dispatchEvent(new CustomEvent("offline-queue-cleared"));
    }
  }

  private async executeOperation(operation: QueuedOperation) {
    const { type, table, data, recordId } = operation;

    switch (type) {
      case "insert":
        const { error: insertError } = await supabase.from(table).insert(data);
        if (insertError) throw insertError;
        break;

      case "update":
        if (!recordId) throw new Error("Record ID required for update");
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq("id", recordId);
        if (updateError) throw updateError;
        break;

      case "delete":
        if (!recordId) throw new Error("Record ID required for delete");
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq("id", recordId);
        if (deleteError) throw deleteError;
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();

// Process queue when coming back online
window.addEventListener("online", () => {
  offlineQueue.processQueue();
});
