"use client";

const ChatBot = ({ setShowChatTimer, showChatTimer }) => {
  return (
    <div className="w-full h-full flex flex-col ">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">ChatBot</h2>
        <button
          onClick={() => setShowChatTimer(!showChatTimer)}
          className="mt-2 p-2 bg-blue-500 text-white rounded"
        >
          {showChatTimer ? "Hide Timer" : "Show Timer"}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4">{/* Chat messages will go here */}</div>

      {/* Input Field */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Message ChatGPT..."
          className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>
    </div>
  );
};

export default ChatBot;
