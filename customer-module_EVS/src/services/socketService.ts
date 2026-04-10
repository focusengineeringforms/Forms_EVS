import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Response created event
    this.socket.on("response-created", (data) => {
      this.notifyListeners("response-created", data);
    });

    // Response updated event
    this.socket.on("response-updated", (data) => {
      this.notifyListeners("response-updated", data);
    });

    // Response deleted event
    this.socket.on("response-deleted", (data) => {
      this.notifyListeners("response-deleted", data);
    });
  }

  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Subscribe to events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Unsubscribe from events
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Join form analytics room
  joinFormAnalytics(formId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-form-analytics", formId);
      console.log(`📊 Joined analytics room for form: ${formId}`);
    }
  }

  // Leave form analytics room
  leaveFormAnalytics(formId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-form-analytics", formId);
      console.log(`📊 Left analytics room for form: ${formId}`);
    }
  }

  // Join dashboard analytics room
  joinDashboardAnalytics() {
    if (this.socket?.connected) {
      this.socket.emit("join-dashboard-analytics");
      console.log("📊 Joined dashboard analytics room");
    }
  }

  // Leave dashboard analytics room
  leaveDashboardAnalytics() {
    if (this.socket?.connected) {
      this.socket.emit("leave-dashboard-analytics");
      console.log("📊 Left dashboard analytics room");
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
