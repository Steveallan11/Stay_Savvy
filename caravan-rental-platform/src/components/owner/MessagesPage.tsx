import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  MessageCircle,
  Send,
  User,
  Clock,
  CheckCircle,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Conversation {
  conversation_id: string
  property_id: string
  latest_message: {
    message_text: string
    sent_at: string
    sender_id: string
    recipient_id: string
  }
  unread_count: number
  message_count: number
  last_activity: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  message_text: string
  sent_at: string
  is_read: boolean
}

export function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase.functions.invoke('communication-management', {
        body: { action: 'get_conversations' },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      return data.data.conversations
    },
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: async (): Promise<Message[]> => {
      if (!selectedConversation) return []
      
      const { data, error } = await supabase.functions.invoke('communication-management', {
        body: {
          action: 'get_conversation_messages',
          conversationId: selectedConversation
        }
      })

      if (error) throw error
      return data.data.messages
    },
    enabled: !!selectedConversation && !!user,
    refetchInterval: 10000 // Refetch every 10 seconds for active conversation
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, messageText, propertyId }: {
      recipientId: string
      messageText: string
      propertyId?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('communication-management', {
        body: {
          action: 'send_message',
          conversationId: selectedConversation,
          recipientId,
          messageText,
          propertyId
        }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message')
    }
  })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    // Find the conversation to get recipient ID
    const conversation = conversations.find(c => c.conversation_id === selectedConversation)
    if (!conversation) return
    
    const recipientId = conversation.latest_message.sender_id === user?.id 
      ? conversation.latest_message.recipient_id 
      : conversation.latest_message.sender_id
    
    sendMessageMutation.mutate({
      recipientId,
      messageText: newMessage,
      propertyId: conversation.property_id
    })
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.latest_message.message_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200/50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <h1 className="text-2xl font-bold text-charcoal mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 mb-3">
                  <div className="animate-pulse">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-1 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-slate-gray">No conversations yet</p>
              <p className="text-sm text-slate-gray">Messages from guests will appear here</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.conversation_id}
                  onClick={() => setSelectedConversation(conversation.conversation_id)}
                  className={`w-full flex items-start space-x-3 p-4 rounded-xl hover:bg-white/60 transition-colors text-left ${
                    selectedConversation === conversation.conversation_id ? 'bg-white/80 shadow-sm' : ''
                  }`}
                >
                  <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark rounded-full p-2 flex-shrink-0">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-charcoal truncate">
                        Guest Conversation
                      </p>
                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                        <span className="text-xs text-slate-gray">
                          {formatMessageTime(conversation.last_activity)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-gray truncate">
                      {conversation.latest_message.message_text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark rounded-full p-2">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">Guest Conversation</h2>
                  <p className="text-sm text-slate-gray">Property inquiry and booking communication</p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-slate-gray">No messages yet</p>
                  <p className="text-sm text-slate-gray">Start the conversation with your guest</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id 
                        ? 'bg-sunset-orange text-white' 
                        : 'bg-gray-100 text-charcoal'
                    }`}>
                      <p className="text-sm">{message.message_text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.sent_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-6 border-t border-gray-200/50">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset-orange focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-white rounded-xl hover:from-sunset-orange-dark hover:to-sunset-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-charcoal mb-2">Select a conversation</h3>
              <p className="text-slate-gray">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}