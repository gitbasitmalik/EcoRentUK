import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth, authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageSquare, 
  User,
  Paperclip,
  Building2,
  Home
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChatBubble = ({ message, isOwn }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
  >
    <div className={`max-w-[75%] ${
      message.is_auto_reply
        ? 'bg-slate-700/60 border border-slate-600/30'
        : isOwn
          ? 'bg-[#00FFAB] text-black'
          : 'bg-[#1E293B] border border-white/5'
    } rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-3`}>
      {!isOwn && (
        <p className={`text-xs font-medium mb-1 ${message.is_auto_reply ? 'text-slate-400' : 'text-[#00FFAB]'}`}>
          {message.sender_name}
        </p>
      )}
      <p className={isOwn && !message.is_auto_reply ? 'text-black' : 'text-slate-200'}>
        {message.message}
      </p>
      {message.attachments?.length > 0 && (
        <div className="mt-2 space-y-2">
          {message.attachments.map((url, i) => (
            <img key={i} src={url} alt="attachment" className="rounded-lg max-w-full max-h-48 object-cover" />
          ))}
        </div>
      )}
      <span className={`text-xs mt-1 block ${isOwn && !message.is_auto_reply ? 'text-black/50' : 'text-slate-500'}`}>
        {new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  </motion.div>
);

export const TenantChatView = () => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [noProperty, setNoProperty] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    initChat();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/chat/start`, { method: 'POST' });
      if (res.ok) {
        const conv = await res.json();
        setConversation(conv);
        await fetchMessages(conv.conversation_id);
        startPolling(conv.conversation_id);
      } else if (res.status === 400) {
        setNoProperty(true);
      }
    } catch (err) {
      console.error('Failed to init chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await authFetch(`${API_URL}/api/conversations/${convId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch {}
  };

  const startPolling = (convId) => {
    pollRef.current = setInterval(() => fetchMessages(convId), 5000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const res = await authFetch(`${API_URL}/api/conversations/${conversation.conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        // Fetch again to get auto-replies
        setTimeout(() => fetchMessages(conversation.conversation_id), 1000);
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await authFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        const res = await authFetch(`${API_URL}/api/conversations/${conversation.conversation_id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '(Image)', attachments: [url] }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => [...prev, msg]);
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#00FFAB] text-lg">Loading chat...</div>
      </div>
    );
  }

  if (noProperty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 text-center"
        data-testid="tenant-chat-no-property"
      >
        <Home className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Property Assigned</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          You need to be assigned to a property before you can message your landlord.
          Please contact your landlord to get set up.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tenant-chat-view">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white font-['Outfit']">Messages</h1>
        <p className="text-slate-400 mt-1">Chat with your landlord</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        {/* Header */}
        {conversation && (
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
              <User className="w-5 h-5 text-[#00FFAB]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Your Landlord</p>
              {conversation.property_address && (
                <p className="text-slate-500 text-xs flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {conversation.property_address}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No messages yet</p>
              <p className="text-slate-500 text-sm">Send a message to your landlord to get started</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.message_id}
                message={msg}
                isOwn={msg.sender_id === user?.user_id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex items-center gap-3">
          <label className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-400 hover:text-white transition-colors">
            <Paperclip className="w-5 h-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 bg-[#112240] border-white/10 text-white placeholder:text-slate-500"
            data-testid="tenant-chat-input"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary px-4 shrink-0"
            data-testid="tenant-chat-send-btn"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
