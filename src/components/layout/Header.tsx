import React, { useState } from 'react';
import { Bell, Search, Menu, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Sample notifications - in a real app, this would come from an API or context
const sampleNotifications = [
  {
    id: '1',
    title: 'New Order Received',
    message: 'Order #ORD-1001 has been placed by Sarah Johnson',
    type: 'info' as const,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    title: 'Low Inventory Alert',
    message: 'Boss Plus massage chair is running low (5 units remaining)',
    type: 'warning' as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false
  },
  {
    id: '3',
    title: 'Shipment Delivered',
    message: 'Shipment #SHIP-2024-001 has been delivered successfully',
    type: 'success' as const,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true
  }
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  // Use React state for notifications
  const [notifications, setNotifications] = useState(sampleNotifications);
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'info':
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shadow-navbar">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search..."
            className="w-full pl-10 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <CartSidebar />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Mark all read
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-80">
              {notifications.length > 0 ? (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div 
                        className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-sm font-medium truncate ${
                                  !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all notifications
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="text-right hidden lg:block">
          <p className="text-sm font-medium">Welcome back!</p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </header>
  );
}