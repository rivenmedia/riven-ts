import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/_ui/popover";
import { cn } from "@/lib/utils";

import { Bell, BellRing, Check, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../_ui/badge";
import { Button } from "../_ui/button";
import { Separator } from "../_ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../_ui/tooltip";
import { useNotificationsContext } from "../providers/notifications-provider";
import { formatTimestamp } from "./utilities/format-timestamp";
import { getTypeColor } from "./utilities/get-type-color";

import type { ComponentProps } from "react";

export interface NotificationCenterProps {
  popoverProps?: Pick<
    ComponentProps<typeof PopoverContent>,
    "side" | "sideOffset" | "align"
  >;
  buttonProps?: Pick<ComponentProps<typeof Button>, "variant" | "className">;
}

export function NotificationCenter({
  buttonProps,
  popoverProps,
}: NotificationCenterProps) {
  const {
    notifications,
    reconnect,
    connectionStatus,
    unreadCount,
    clear: clearNotifications,
    markAllAsRead,
    markAsRead,
    remove: removeNotification,
  } = useNotificationsContext();

  function handleMarkAsRead(id: string) {
    markAsRead(id);
  }

  function handleMarkAllAsRead() {
    markAllAsRead();
    toast.success("All notifications marked as read");
  }

  function handleClearAll() {
    clearNotifications();
    toast.success("All notifications cleared");
  }

  function handleRemove(id: string) {
    removeNotification(id);
  }

  const { className: buttonClassName, variant = "outline" } = buttonProps ?? {};

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open notification center"
          className={cn("h-10 w-10 cursor-pointer", buttonClassName)}
          size="icon"
          variant={variant}
        >
          {unreadCount > 0 ? (
            <BellRing className="text-primary fill-primary/10 size-5" />
          ) : (
            <Bell className="size-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-labelledby="notificationsDialogTitle"
        className="w-96 rounded-2xl border border-white/10 bg-zinc-950/95 p-0 shadow-2xl shadow-black/50 backdrop-blur-2xl"
        side={popoverProps?.side ?? "bottom"}
        align={popoverProps?.align ?? "end"}
        sideOffset={popoverProps?.sideOffset ?? 4}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 pb-3">
            <h3 className="text-sm font-semibold" id="notificationsDialogTitle">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Mark all as read"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground h-7 w-7"
                      onClick={handleMarkAllAsRead}
                    >
                      <CheckCheck className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark all as read</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {notifications.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Clear all notifications"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all notifications</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <Separator />

          <div className="max-h-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-muted/20 mb-4 flex items-center justify-center rounded-full p-4">
                  <Bell className="text-muted-foreground/50 size-8" />
                </div>
                <p className="text-foreground text-sm font-medium">
                  No notifications yet
                </p>
                <p className="text-muted-foreground/70 mt-1 text-xs">
                  You&apos;ll be notified when items complete
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "border-border/50 hover:bg-muted/30 border-b p-3 transition-colors",
                    !notification.read && "bg-muted/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${getTypeColor(notification.type)} text-[10px]`}
                        >
                          {notification.type}
                        </Badge>
                        {notification.count > 1 && (
                          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                            ×{notification.count}
                          </span>
                        )}
                        {!notification.read && (
                          <div className="size-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm leading-none font-medium">
                        {notification.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground/70 text-xs">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              aria-label="Mark as read"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-primary size-6"
                              onClick={() => {
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as read</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Remove notification"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-6"
                            onClick={() => {
                              handleRemove(notification.id);
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {connectionStatus === "error" && (
            <div className="border-destructive/20 bg-destructive/10 border-t p-3">
              <p className="text-destructive text-xs">
                Connection error. Notifications may be delayed.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-6 text-xs"
                onClick={() => {
                  reconnect();
                }}
              >
                Reconnect
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
