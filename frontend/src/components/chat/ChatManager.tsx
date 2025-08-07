import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Menu,
  Plus,
  MessageSquare,
  Folder,
  FolderPlus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatFolder {
  id: string;
  name: string;
  chatIds: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatManagerProps {
  currentChatId: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: (folderId?: string) => Promise<string>;
  chats: Chat[];
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatManager({
  currentChatId,
  onChatSelect,
  onNewChat,
  chats,
  onUpdateChat,
  onDeleteChat,
}: ChatManagerProps) {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Load folders from localStorage
  useEffect(() => {
    const savedFolders = localStorage.getItem("fitness_chat_folders");
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }
  }, []);

  // Save folders to localStorage
  useEffect(() => {
    localStorage.setItem("fitness_chat_folders", JSON.stringify(folders));
  }, [folders]);

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: ChatFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      chatIds: [],
    };

    setFolders([...folders, newFolder]);
    setNewFolderName("");
  };

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter((f) => f.id !== folderId));
  };

  const renameFolder = (folderId: string, newName: string) => {
    setFolders(
      folders.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
    setEditingFolderId(null);
  };

  const moveChatToFolder = (chatId: string, folderId: string) => {
    // Remove chat from all folders first
    const updatedFolders = folders.map((folder) => ({
      ...folder,
      chatIds: folder.chatIds.filter((id) => id !== chatId),
    }));

    // Add chat to target folder
    const targetFolder = updatedFolders.find((f) => f.id === folderId);
    if (targetFolder) {
      targetFolder.chatIds.push(chatId);
    }

    setFolders(updatedFolders);
  };

  const removeChatFromFolder = (chatId: string) => {
    setFolders(
      folders.map((folder) => ({
        ...folder,
        chatIds: folder.chatIds.filter((id) => id !== chatId),
      }))
    );
  };

  const handleNewChat = async () => {
    const newChatId = await onNewChat(selectedFolderId || undefined);
    // // If a folder is selected, automatically add the new chat to it
    // if (selectedFolderId && newChatId) {
    //   setTimeout(() => {
    //     moveChatToFolder(newChatId, selectedFolderId);
    //   }, 100);
    // }
  };

  const filteredChats = chats.filter(
    (chat) =>
      typeof chat?.title === "string" &&
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unorganizedChats = filteredChats.filter(
    (chat) => !folders.some((folder) => folder?.chatIds.includes(chat.id))
  );

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const [tempTitle, setTempTitle] = useState(chat.title);

    useEffect(() => {
      if (editingChatId === chat.id) {
        setTempTitle(chat.title); // Sync when editing starts
      }
    }, [editingChatId, chat.title]);

    const handleSave = () => {
      if (tempTitle.trim() && tempTitle !== chat.title) {
        onUpdateChat(chat.id, { title: tempTitle.trim() });
      }
      setEditingChatId(null);
    };

    return (
      <div
        className={cn(
          "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
          currentChatId === chat.id && "bg-accent"
        )}
        onClick={() => onChatSelect(chat.id)}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {editingChatId === chat.id ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditingChatId(null);
              }}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <span className="text-sm truncate">{chat.title}</span>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-1"
            align="end"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setEditingChatId(chat.id)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </Button>
            {folders.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Move to folder
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-1"
                  side="left"
                >
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => moveChatToFolder(chat.id, folder.id)}
                    >
                      {folder.name}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => removeChatFromFolder(chat.id)}
                  >
                    Remove from folder
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            <Separator className="my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => onDeleteChat(chat.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  //   const FolderItem = ({ folder }: { folder: ChatFolder }) => {
  //     const folderChats = chats.filter((chat) =>
  //       folder.chatIds.includes(chat.id)
  //     );

  //     return (
  //       <div className="space-y-1">
  //         <div
  //           className={cn(
  //             "group flex items-center justify-between p-2 rounded-md hover:bg-accent/30 cursor-pointer transition-colors",
  //             selectedFolderId === folder.id &&
  //               "bg-accent/50 border border-accent"
  //           )}
  //           onClick={() =>
  //             setSelectedFolderId(
  //               selectedFolderId === folder.id ? null : folder.id
  //             )
  //           }
  //         >
  //           <div className="flex items-center space-x-2 flex-1">
  //             <Folder className="w-4 h-4 text-muted-foreground" />
  //             {editingFolderId === folder.id ? (
  //               <Input
  //                 value={folder.name}
  //                 onChange={(e) =>
  //                   setFolders(
  //                     folders.map((f) =>
  //                       f.id === folder.id ? { ...f, name: e.target.value } : f
  //                     )
  //                   )
  //                 }
  //                 onBlur={() => setEditingFolderId(null)}
  //                 onKeyDown={(e) => {
  //                   if (e.key === "Enter") {
  //                     const updatedFolder = folders.find(
  //                       (f) => f.id === folder.id
  //                     );
  //                     if (updatedFolder) {
  //                       renameFolder(folder.id, updatedFolder.name);
  //                     }
  //                   }
  //                 }}
  //                 className="h-6 text-sm"
  //                 autoFocus
  //               />
  //             ) : (
  //               <span className="text-sm font-medium">{folder.name}</span>
  //             )}
  //             <span className="text-xs text-muted-foreground">
  //               ({folderChats.length})
  //             </span>
  //           </div>
  //           <Popover>
  //             <PopoverTrigger asChild>
  //               <Button
  //                 variant="ghost"
  //                 size="sm"
  //                 className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
  //               >
  //                 <MoreVertical className="w-3 h-3" />
  //               </Button>
  //             </PopoverTrigger>
  //             <PopoverContent
  //               className="w-48 p-1"
  //               align="end"
  //             >
  //               <Button
  //                 variant="ghost"
  //                 size="sm"
  //                 className="w-full justify-start"
  //                 onClick={() => setEditingFolderId(folder.id)}
  //               >
  //                 <Edit className="w-4 h-4 mr-2" />
  //                 Rename
  //               </Button>
  //               <Button
  //                 variant="ghost"
  //                 size="sm"
  //                 className="w-full justify-start text-destructive hover:text-destructive"
  //                 onClick={() => deleteFolder(folder.id)}
  //               >
  //                 <Trash2 className="w-4 h-4 mr-2" />
  //                 Delete
  //               </Button>
  //             </PopoverContent>
  //           </Popover>
  //         </div>
  //         <div className="ml-6 space-y-1">
  //           {folderChats.map((chat) => (
  //             <ChatItem
  //               key={chat.id}
  //               chat={chat}
  //             />
  //           ))}
  //         </div>
  //       </div>
  //     );
  //   };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-4">
        <Button
          onClick={handleNewChat}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {selectedFolderId
            ? `New Chat in ${
                folders.find((f) => f.id === selectedFolderId)?.name
              }`
            : "New Chat"}
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* <div className="flex items-center space-x-2">
          <Input
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createFolder();
            }}
            className="flex-1"
          />
          <Button onClick={createFolder} size="sm" variant="outline">
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div> */}
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {/* {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
            />
          ))} */}

          {filteredChats.length > 0 && (
            <div className="space-y-1">
              {/* {folders.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    Unorganized
                  </div>
                </>
              )} */}
              {filteredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r bg-card">
        {sidebarContent}
      </div>

      {/* Mobile Sheet */}
      <div className="md:hidden fixed top-0 left-0 z-50 w-full bg-background p-4 border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 p-0"
          >
            <SheetHeader className="p-4">
              <SheetTitle>Chat History</SheetTitle>
            </SheetHeader>
            <div className="h-full">{sidebarContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
