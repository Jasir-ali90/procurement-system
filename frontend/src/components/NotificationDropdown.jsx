import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await API.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await API.patch(`/notifications/${notif._id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (e) { }
        }
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: isOpen ? 'var(--plum-100)' : 'transparent',
                    border: '1px solid ' + (isOpen ? 'var(--plum-300)' : 'var(--border-subtle)'),
                    borderRadius: 'var(--radius-md)',
                    padding: '0.55rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--plum-900)',
                    transition: 'all 0.2s ease'
                }}
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'linear-gradient(135deg, var(--peach-500), var(--peach-600))',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        height: '18px',
                        minWidth: '18px',
                        padding: '0 4px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(255, 126, 95, 0.4)'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '380px',
                    maxWidth: '90vw',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 999,
                    overflow: 'hidden',
                    animation: 'slideUp 0.2s ease'
                }}>
                    <div style={{
                        padding: '1rem 1.25rem',
                        background: 'linear-gradient(135deg, var(--plum-900) 0%, var(--plum-700) 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.01em' }}>Notifications</h4>
                            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', opacity: 0.85 }}>
                                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'You are all caught up'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.25)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <CheckCheck size={13} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '0.85rem 1.25rem',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        background: n.isRead ? '#FFFFFF' : 'var(--peach-50)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        gap: '0.75rem',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = n.isRead ? '#FAF7F9' : 'var(--peach-100)'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? '#FFFFFF' : 'var(--peach-50)'}
                                >
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: n.isRead ? 'transparent' : 'var(--peach-500)',
                                        marginTop: '0.45rem',
                                        flexShrink: 0
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h5 style={{
                                                margin: 0,
                                                fontSize: '0.8125rem',
                                                fontWeight: n.isRead ? 600 : 700,
                                                color: n.isRead ? 'var(--text-main)' : 'var(--plum-900)'
                                            }}>
                                                {n.title || 'Procurement Alert'}
                                            </h5>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Clock size={11} />
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: '0.25rem 0 0 0',
                                            fontSize: '0.78rem',
                                            color: 'var(--text-body)',
                                            lineHeight: 1.4
                                        }}>
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(n._id, e)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '0.2rem',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Mark as read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
