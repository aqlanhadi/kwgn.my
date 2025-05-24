import React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count: number | null;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, setActiveTab, className }) => (
  <div className={cn("border-b border-gray-200 bg-white mb-6", className)}>
    <nav className="-mb-px flex space-x-8 max-w-7xl mx-auto px-8" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
            activeTab === tab.id
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          {tab.label}
          {tab.count !== null && (
            <span className={cn(
              "ml-2 py-0.5 px-2 rounded-full text-xs",
              activeTab === tab.id
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-900"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  </div>
); 