import React, { useState } from 'react';
import { Input, Avatar, Badge, Button, Tooltip } from 'antd';
import { 
  SearchOutlined, SendOutlined, PaperClipOutlined, 
  SmileOutlined, MoreOutlined, PhoneOutlined, VideoCameraOutlined
} from '@ant-design/icons';

const ChatPage = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [messageInput, setMessageInput] = useState('');

  // Dữ liệu danh sách người chat
  const conversations = [
    { id: 1, name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?img=1', lastMsg: 'Shop ơi cho mình hỏi bó này còn không?', time: '2m', unread: 2, status: 'online' },
    { id: 2, name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?img=5', lastMsg: 'Cảm ơn shop nhé!', time: '1h', unread: 0, status: 'offline' },
    { id: 3, name: 'Lê Hoàng C', avatar: 'https://i.pravatar.cc/150?img=3', lastMsg: 'Đơn hàng của mình đi chưa ạ?', time: '1d', unread: 0, status: 'online' },
  ];

  // Dữ liệu tin nhắn chi tiết
  const [messages, setMessages] = useState([
    { id: 1, sender: 'user', text: 'Chào shop ạ', time: '10:00 AM' },
    { id: 2, sender: 'admin', text: 'Chào bạn, Flower Shop có thể giúp gì cho bạn?', time: '10:01 AM' },
    { id: 3, sender: 'user', text: 'Shop ơi cho mình hỏi bó Hoa Hồng Đỏ Valentine còn hàng không ạ?', time: '10:02 AM' },
    { id: 4, sender: 'user', text: 'Mình cần giao gấp chiều nay.', time: '10:02 AM' },
  ]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    setMessages([...messages, { 
      id: Date.now(), 
      sender: 'admin', 
      text: messageInput, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setMessageInput('');
  };

  const currentChatUser = conversations.find(c => c.id === activeChat);

  return (
    <div className="w-full h-[calc(100vh-140px)] bg-white rounded-[20px] shadow-sm flex overflow-hidden">
      
      {/* --- CỘT TRÁI: DANH SÁCH HỘI THOẠI --- */}
      <div className="w-[320px] flex-shrink-0 border-r border-gray-100 flex flex-col">
         {/* Header & Search */}
         <div className="p-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-navy-700 mb-3">Tin nhắn</h3>
            <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm kiếm..." className="rounded-xl bg-[#F4F7FE] border-none" />
         </div>
         
         {/* List */}
         <div className="flex-1 overflow-y-auto p-2">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setActiveChat(conv.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeChat === conv.id ? 'bg-light-primary' : 'hover:bg-gray-50'}`}
              >
                 <div className="relative">
                    <Avatar src={conv.avatar} size={48} />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${conv.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                       <h5 className="font-bold text-navy-700 truncate">{conv.name}</h5>
                       <span className="text-xs text-gray-400">{conv.time}</span>
                    </div>
                    <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-navy-700' : 'text-gray-500'}`}>
                       {conv.lastMsg}
                    </p>
                 </div>
                 {conv.unread > 0 && (
                   <div className="bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                     {conv.unread}
                   </div>
                 )}
              </div>
            ))}
         </div>
      </div>

      {/* --- CỘT PHẢI: KHUNG CHAT --- */}
      <div className="flex-1 flex flex-col bg-[#F4F7FE]/30">
         
         {/* Header Chat */}
         <div className="h-[70px] bg-white border-b border-gray-100 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
               <Avatar src={currentChatUser?.avatar} size={40} />
               <div>
                  <h4 className="font-bold text-navy-700 m-0">{currentChatUser?.name}</h4>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                     ● Đang hoạt động
                  </span>
               </div>
            </div>
            
         </div>

         {/* Message Area */}
         <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {messages.map(msg => (
               <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'user' && <Avatar src={currentChatUser?.avatar} size={32} className="mr-2 mt-1" />}
                  
                  <div className={`max-w-[70%] p-3 rounded-2xl ${
                     msg.sender === 'admin' 
                     ? 'bg-brand-500 text-white rounded-tr-none' 
                     : 'bg-white text-navy-700 shadow-sm rounded-tl-none'
                  }`}>
                     <p className="text-sm">{msg.text}</p>
                     <span className={`text-[10px] block text-right mt-1 ${msg.sender === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.time}
                     </span>
                  </div>
               </div>
            ))}
         </div>

         {/* Input Area */}
         <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3 bg-[#F4F7FE] p-2 rounded-xl">
               <Button type="text" shape="circle" icon={<PaperClipOutlined />} className="text-gray-500" />
               <Input 
                  placeholder="Nhập tin nhắn..." 
                  bordered={false} 
                  className="bg-transparent"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onPressEnter={handleSend}
               />
               <Button type="text" shape="circle" icon={<SmileOutlined />} className="text-gray-500" />
               <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<SendOutlined />} 
                  className="bg-brand-500 shadow-brand-500/50"
                  onClick={handleSend}
               />
            </div>
         </div>
      </div>

    </div>
  );
};

export default ChatPage;