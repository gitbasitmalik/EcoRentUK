import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, authFetch } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  MessageSquare, 
  User,
  Trash2,
  Inbox,
  Image as ImageIcon,
  ArrowLeft,
  Building2,
  Paperclip,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ConversationItem = ({ conversation, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl transition-all ${
      isSelected
        ? 'bg-[#00FFAB]/15 border border-[#00FFAB]/30'
        : 'bg-white/5 hover:bg-white/10 border border-transparent'
    }`}
    data-testid={`conversation-${conversation.conversation_id}`}
  >
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-[#00FFAB]/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-[#00FFAB]" />
        </div>
        {conversation.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00FFAB] text-black text-xs font-bold flex items-center justify-center">
            {conversation.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{conversation.tenant_name}</p>
        <p className="text-slate-500 text-xs truncate">{conversation.tenant_email}</p>
        {conversation.last_message && (
          <p className="text-slate-400 text-sm truncate mt-1">{conversation.last_message}</p>
        )}
      </div>
    </div>
    {conversation.property_address && (
      <div className="mt-2 flex items-center gap-1 text-slate-500 text-xs">
        <Building2 className="w-3 h-3" />
        <span className="truncate">{conversation.property_address}</span>
      </div>
    )}
  </button>
);

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

export const TenantChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setShowMobileList(false);
    setLoadingMsgs(true);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const res = await authFetch(`${API_URL}/api/conversations/${conv.conversation_id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMsgs(false);
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await authFetch(`${API_URL}/api/conversations/${conv.conversation_id}/messages`);
        if (res.ok) setMessages(await res.json());
      } catch {}
    }, 5000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;
    
    setSending(true);
    try {
      const res = await authFetch(`${API_URL}/api/conversations/${selectedConv.conversation_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await authFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        const res = await authFetch(`${API_URL}/api/conversations/${selectedConv.conversation_id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '(Image)', attachments: [url] }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => [...prev, msg]);
          fetchConversations();
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const handleDeleteConv = async (convId) => {
    if (!window.confirm('Delete this conversation and all messages?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Conversation deleted');
        setConversations(prev => prev.filter(c => c.conversation_id !== convId));
        if (selectedConv?.conversation_id === convId) {
          setSelectedConv(null);
          setMessages([]);
          setShowMobileList(true);
        }
      }
    } catch { toast.error('Failed to delete conversation'); }
  };

  return (
    <div className="space-y-6" data-testid="tenant-chat-page">
      <div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">Messages</h1>
        <p className="text-slate-400 mt-1">Communicate with your tenants</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation List */}
        <div className={`w-full lg:w-80 border-r border-white/10 flex flex-col shrink-0 ${
          !showMobileList ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Conversations</h3>
            <p className="text-slate-500 text-xs mt-0.5">{conversations.length} thread{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {loadingConvs ? (
                [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No conversations yet</p>
                </div>
              ) : conversations.map(conv => (
                <div key={conv.conversation_id} className="relative group">
                  <ConversationItem
                    conversation={conv}
                    isSelected={selectedConv?.conversation_id === conv.conversation_id}
                    onClick={() => selectConversation(conv)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.conversation_id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                    data-testid={`delete-conv-${conv.conversation_id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-10 h-10 rounded-full bg-[#00FFAB]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#00FFAB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{selectedConv.tenant_name}</p>
                  <p className="text-slate-500 text-xs truncate">{selectedConv.property_address || selectedConv.tenant_email}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8">
                    <div className="text-slate-400">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No messages yet</p>
                    <p className="text-slate-500 text-sm">Send the first message to start the conversation</p>
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
                  data-testid="chat-message-input"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="btn-primary px-4 shrink-0"
                  data-testid="chat-send-btn"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-slate-400">Choose a tenant conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
