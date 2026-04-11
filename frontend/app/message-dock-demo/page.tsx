"use client";

import { MessageDock, Character } from "@/components/ui/message-dock";

const customCharacters: Character[] = [
  { emoji: "✨", name: "Sparkle", online: false },
  {
    emoji: "🧙‍♂️",
    name: "Wizard",
    online: true,
    backgroundColor: "bg-green-300",
    gradientColors: "#86efac, #dcfce7",
  },
  {
    emoji: "🦄",
    name: "Unicorn",
    online: true,
    backgroundColor: "bg-purple-300",
    gradientColors: "#c084fc, #f3e8ff",
  },
  {
    emoji: "🐵",
    name: "Monkey",
    online: true,
    backgroundColor: "bg-yellow-300",
    gradientColors: "#fde047, #fefce8",
  },
  {
    emoji: "🤖",
    name: "Robot",
    online: false,
    backgroundColor: "bg-red-300",
    gradientColors: "#fca5a5, #fef2f2",
  },
];

export default function Demo() {
  const handleMessageSend = (message: string, character: Character, index: number) => {
    console.log("Message sent:", { message, character: character.name, index });
    // Here you would typically send the message to your backend/API
  };

  const handleCharacterSelect = (character: Character) => {
    console.log("Character selected:", character.name);
  };

  const handleDockToggle = (isExpanded: boolean) => {
    console.log("Dock expanded:", isExpanded);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <MessageDock 
        characters={customCharacters}
        onMessageSend={handleMessageSend}
        onCharacterSelect={handleCharacterSelect}
        onDockToggle={handleDockToggle}
        expandedWidth={500}
        placeholder={(name) => `Send a message to ${name}...`}
        theme="light"
        enableAnimations={true}
        closeOnSend={true}
        autoFocus={true}
      />
    </div>
  );
}
