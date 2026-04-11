import React from "react";
import { SearchComponent } from "@/components/ui/search-bar";

const searchData = [
  {
    id: 1,
    creator: "John Doe",
    title: "AI-Powered Chatbot",
    description:
      "A chatbot that can answer common customer queries using natural language processing.",
    tags: ["AI", "Chatbot", "Customer Support"],
  },
  {
    id: 2,
    creator: "Jane Smith",
    title: "Smart Home Automation",
    description:
      "A system to control home appliances via a mobile app using IoT technology.",
    tags: ["IoT", "Smart Home", "Automation"],
  },
  {
    id: 3,
    creator: "Alice Johnson",
    title: "Eco-Friendly Delivery Service",
    description:
      "A sustainable delivery service using electric bikes to reduce carbon emissions.",
    tags: ["Sustainability", "Delivery", "Eco-Friendly"],
  },
  {
    id: 4,
    creator: "Michael Brown",
    title: "Blockchain-Based Voting System",
    description:
      "A secure and transparent online voting system using blockchain technology.",
    tags: ["Blockchain", "Security", "Voting"],
  },
  {
    id: 5,
    creator: "Emma Wilson",
    title: "AI-Powered Resume Screener",
    description:
      "An AI tool that screens resumes and ranks candidates based on job requirements.",
    tags: ["AI", "Recruitment", "HR Tech"],
  },
];

const Demo = () => {
  return (
    <div className="p-6">
      <SearchComponent data={searchData} />
    </div>
  );
};

export { Demo };
